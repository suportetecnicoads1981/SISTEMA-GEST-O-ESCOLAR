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
        // If no ID, store by index or timestamp key
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
          const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' });
          if (error) {
            console.warn(`[Supabase Batch] Error upserting table ${table}:`, error);
          } else {
            console.log(`[Supabase Batch] Successfully upserted ${chunk.length} records into table "${table}".`);
          }
        }
      }
    } catch (err) {
      console.warn('[Supabase Batch] Flush execution failed:', err);
    } finally {
      this.isFlushing = false;
    }
  }
}

export const supabaseBatchQueue = new SupabaseBatchQueue();
