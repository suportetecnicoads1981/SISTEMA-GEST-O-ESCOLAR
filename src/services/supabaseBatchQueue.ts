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

  private sanitizeForTable(table: string, records: any[]): any[] {
    if (table === 'exams') {
      return records.map((e: any, idx: number) => ({
        id: e.id || ('exam_' + idx),
        title: e.title || ('Avaliação ' + (idx + 1)),
        description: e.description || null,
        subject: e.subject || e.subjectId || 'Geral',
        class_id: e.classId || null,
        teacher_name: e.teacherName || null,
        school_year: e.schoolYear || 2026,
        term: e.term || '1º Bimestre',
        total_points: e.totalPoints || 10.0,
        passing_score: e.passingScore || 6.0,
        time_limit_minutes: e.timeLimitMinutes || 60,
        questions: e.questions || [],
        status: e.status || 'PUBLISHED',
      }));
    }
    if (table === 'students') {
      return records.map((s: any, idx: number) => ({
        id: s.id || ('std_' + idx),
        name: s.name,
        registration_number: s.registrationNumber || s.registration_number || ('RA-2026-' + idx),
        status: s.status || 'ACTIVE',
        class_id: s.classId || s.class_id || null,
        birth_date: s.birthDate || s.birth_date || '2015-01-01',
        cpf: s.cpf || null,
        rg: s.rg || null,
        gender: s.gender || 'M',
        email: s.email || null,
        phone: s.phone || null,
        guardian_name: s.guardianName || s.guardian_name || 'Responsável Legal',
        guardian_phone: s.guardianPhone || s.guardian_phone || null,
        address: s.address || null,
        city: s.city || 'São Paulo',
        state: s.state || 'SP',
        location_zone: s.locationZone || s.location_zone || 'URBANA',
        cadastral_status: s.cadastralStatus || s.cadastral_status || 'COMPLETE',
        medical_observations: s.medicalObservations || s.medical_observations || null,
        has_aee: s.hasAee !== undefined ? s.hasAee : (s.has_aee || false),
        photo_url: s.photoUrl || s.photo_url || null,
        school_unit_id: s.schoolUnitId || s.school_unit_id || null,
      }));
    }
    return records;
  }

  public async flush(): Promise<void> {
    if (this.isFlushing || this.queue.size === 0) return;
    this.isFlushing = true;

    const currentQueue = this.queue;
    this.queue = new Map();

    try {
      const supabase = getSupabaseClient();
      
      for (const [table, recordMap] of currentQueue.entries()) {
        const rawArray = Array.from(recordMap.values());
        if (rawArray.length === 0) continue;

        const recordsArray = this.sanitizeForTable(table, rawArray);

        // Batch upsert in chunks of 500 to respect Postgres limits
        const chunkSize = 500;
        for (let i = 0; i < recordsArray.length; i += chunkSize) {
          const chunk = recordsArray.slice(i, i + chunkSize);
          
          const result = await this.retryWithBackoff(async () => {
            return await supabase.from(table).upsert(chunk, { onConflict: 'id' });
          });

          if (result.error) {
            console.warn(`[Supabase Batch] Failed to upsert table "${table}":`, result.error);
            // Only re-enqueue if error is temporary/network/rate-limit related (429, 5xx), NOT schema mismatch (PGRST204)
            const code = result.error?.code || '';
            const isSchemaError = code === 'PGRST204' || code === '42703';
            if (!isSchemaError) {
              if (!this.queue.has(table)) {
                this.queue.set(table, new Map());
              }
              const fallbackMap = this.queue.get(table)!;
              for (const rec of chunk) {
                if (rec && rec.id) {
                  fallbackMap.set(rec.id, rec);
                }
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
