import { getSupabaseClient } from './supabaseClient';

class SupabaseBatchQueue {
  private queue: Map<string, Map<string, any>> = new Map();
  private timer: any = null;
  private isFlushing = false;
  private flushIntervalMs = 5000; // 5 seconds

  constructor() {
    this.startTimer();
  }

  private startTimer() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.flush().catch((err) => console.warn('Supabase batch flush interval error:', err));
    }, this.flushIntervalMs);
  }

  public enqueue(table: string, records: any[]) {
    if (!records || records.length === 0) return;
    
    if (!this.queue.has(table)) {
      this.queue.set(table, new Map());
    }

    const tableMap = this.queue.get(table)!;
    for (const record of records) {
      if (record && record.id) {
        tableMap.set(record.id, record);
      } else {
        tableMap.set(`non_id_${Math.random()}`, record);
      }
    }

    // If queue grows large (> 100 items total across tables), flush immediately
    let totalItems = 0;
    this.queue.forEach((map) => {
      totalItems += map.size;
    });

    if (totalItems >= 100) {
      this.flush().catch(() => {});
    }
  }

  private async retryWithBackoff(
    fn: () => Promise<{ error: any }>,
    maxRetries = 3,
    initialDelay = 1000
  ): Promise<{ error: any }> {
    let attempt = 0;
    let delay = initialDelay;
    while (true) {
      try {
        const res = await fn();
        if (!res.error) return res;
        attempt++;
        if (attempt > maxRetries) return res;
        console.warn(`[Supabase Batch] Attempt ${attempt} failed (Rate limit/Network), retrying in ${delay}ms...`, res.error);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } catch (err) {
        attempt++;
        if (attempt > maxRetries) throw err;
        console.warn(`[Supabase Batch] Attempt ${attempt} threw error, retrying in ${delay}ms...`, err);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  }

  public async flush(): Promise<void> {
    if (this.isFlushing || this.queue.size === 0) return;
    this.isFlushing = true;

    const currentQueue = this.queue;
    this.queue = new Map();

    try {
      const supabase = getSupabaseClient();
      
      for (const [table, recordMap] of currentQueue.entries()) {
        const recordsArray = Array.from(recordMap.values());
        if (recordsArray.length === 0) continue;

        // Batch upsert in chunks of 500 to respect Postgres limits
        const chunkSize = 500;
        for (let i = 0; i < recordsArray.length; i += chunkSize) {
          const chunk = recordsArray.slice(i, i + chunkSize);
          
          const result = await this.retryWithBackoff(async () => {
            return await supabase.from(table).upsert(chunk, { onConflict: 'id' });
          });

          if (result.error) {
            console.warn(`[Supabase Batch] Failed to upsert table "${table}" after retries:`, result.error);
            // Re-enqueue failed records back to queue to prevent data loss
            if (!this.queue.has(table)) {
              this.queue.set(table, new Map());
            }
            const fallbackMap = this.queue.get(table)!;
            for (const rec of chunk) {
              if (rec && rec.id) {
                fallbackMap.set(rec.id, rec);
              } else {
                fallbackMap.set(`non_id_${Math.random()}`, rec);
              }
            }
          } else {
            console.log(`[Supabase Batch] Successfully upserted ${chunk.length} records into table "${table}".`);
          }
        }
      }
    } catch (err) {
      console.warn('[Supabase Batch] Flush execution failed critically:', err);
      // Re-merge currentQueue back if critical failure occurred
      currentQueue.forEach((tableMap, table) => {
        if (!this.queue.has(table)) {
          this.queue.set(table, new Map());
        }
        const targetMap = this.queue.get(table)!;
        tableMap.forEach((rec, key) => {
          targetMap.set(key, rec);
        });
      });
    } finally {
      this.isFlushing = false;
    }
  }
}

export const supabaseBatchQueue = new SupabaseBatchQueue();
