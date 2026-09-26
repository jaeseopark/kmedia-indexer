/**
 * Daily ingestion report functionality
 * Sends a report to ntfy.sh if NTFY_TOPIC is configured
 */
import schedule from 'node-schedule';
import { get24HourStats } from '../db.js';

const NTFY_TOPIC = process.env.NTFY_TOPIC;
const NTFY_URL = NTFY_TOPIC ? `https://ntfy.sh/${NTFY_TOPIC}` : null;

/**
 * Generate the daily report message
 */
export function generateDailyReportMessage(): string {
  const stats = get24HourStats();
  
  let message = 'DAILY INGESTION REPORT\n\n';
  message += `Records in last 24 hours: ${stats.count}\n`;
  
  if (stats.count === 0) {
    message += 'No records ingested in the last 24 hours\n';
  } else {
    message += '\nLatest titles:\n';
    stats.titles.forEach((title, index) => {
      message += `${index + 1}. ${title}\n`;
    });
  }
  
  return message;
}

/**
 * Send the daily report to ntfy.sh
 */
export async function sendDailyReport(): Promise<void> {
  if (!NTFY_URL) {
    console.log('[dailyReport] NTFY_TOPIC not configured, skipping report');
    return;
  }

  try {
    const message = generateDailyReportMessage();
    
    const response = await fetch(NTFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: message,
    });

    if (!response.ok) {
      console.error(`[dailyReport] Failed to send report: ${response.status} ${response.statusText}`);
      return;
    }

    console.log('[dailyReport] Daily ingestion report sent successfully');
  } catch (error) {
    console.error('[dailyReport] Error sending daily report:', error);
  }
}

/**
 * Initialize the daily report scheduler
 * Runs at 11:59 PM every day (local time)
 */
export function initializeDailyReportScheduler(): void {
  if (!NTFY_TOPIC) {
    console.log('[dailyReport] NTFY_TOPIC not configured, daily report scheduler disabled');
    return;
  }

  // Schedule for 11:59 PM every day (local time)
  // Using cron pattern: 59 23 * * * (minute hour * * dayOfWeek)
  const job = schedule.scheduleJob('59 23 * * *', async () => {
    console.log('[dailyReport] Running scheduled daily ingestion report...');
    await sendDailyReport();
  });

  console.log('[dailyReport] Daily report scheduler initialized (runs at 23:59 every day)');

  // Store reference for graceful shutdown
  (global as any).dailyReportJob = job;
}

/**
 * Cleanup the scheduler (for graceful shutdown)
 */
export function cancelDailyReportScheduler(): void {
  const job = (global as any).dailyReportJob;
  if (job) {
    job.cancel();
    console.log('[dailyReport] Daily report scheduler cancelled');
  }
}
