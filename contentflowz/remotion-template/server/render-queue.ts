import {
  makeCancelSignal,
  renderMedia,
  selectComposition,
} from "@remotion/renderer";
import dotenv from 'dotenv';
import { randomUUID } from "node:crypto";

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_BOT_TOKEN) {
    console.warn(
      "Missing TELEGRAM_BOT_TOKEN environment variable. Automatic video sending will be disabled."
    );
}

interface JobData {
  chatId: string | number;
  quizData: {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswerIndex: number;
    }>;
  };
}

type JobState =
  | {
      status: "queued";
      data: JobData;
      cancel: () => void;
    }
  | {
      status: "in-progress";
      progress: number;
      data: JobData;
      cancel: () => void;
    }
  | {
      status: "completed";
      buffer: Buffer;
      telegramSent: boolean | null;
      telegramError: string | null;
      data: JobData;
    }
  | {
      status: "failed";
      error: Error;
      data: JobData;
    };

export const makeRenderQueue = ({
  port,
  serveUrl,
  rendersDir,
}: {
  port: number;
  serveUrl: string;
  rendersDir: string;
}) => {
  const jobs = new Map<string, JobState>();
  let queue: Promise<unknown> = Promise.resolve();

  const processRender = async (jobId: string) => {
    const job = jobs.get(jobId);
    if (!job) {
      throw new Error(`Render job ${jobId} not found`);
    }

    const { cancel, cancelSignal } = makeCancelSignal();

    jobs.set(jobId, {
      progress: 0,
      status: "in-progress",
      cancel: cancel,
      data: job.data,
    });

    try {
      const inputProps = {
        quizData: job.data.quizData,
      };

      const composition = await selectComposition({
        serveUrl,
        id: "QuizVideo",
        inputProps,
      });

      const output = await renderMedia({
        cancelSignal,
        serveUrl,
        composition,
        codec: "h264",
        onProgress: (progress) => {
          console.info(`${jobId} render progress:`, progress.progress);
          jobs.set(jobId, {
            progress: progress.progress,
            status: "in-progress",
            cancel: cancel,
            data: job.data,
          });
        },
        // outputLocation: path.join(rendersDir, `${jobId}.mp4`),
      });

      if (!output.buffer) {
        throw new Error("Render output buffer is undefined");
      }

      const completedJobCheck = jobs.get(jobId);
      let telegramSentSuccessfully: boolean | null = null;
      let telegramSendError: string | null = null;

      if(completedJobCheck && completedJobCheck.status === 'in-progress'){
        if(output.buffer) {
          console.log(`Job ${jobId} rendered successfully. Buffer size: ${output.buffer.length} bytes.`);

          const chatId = completedJobCheck.data.chatId;
          if (TELEGRAM_BOT_TOKEN && chatId) {
            console.log(`Attempting to send video for job ${jobId} to chat ${chatId}...`);
            const form = new FormData();
            form.append('chat_id', String(chatId));
            const videoBlob = new Blob([output.buffer], { type: 'video/mp4' });
            form.append('video', videoBlob, `${jobId}.mp4`);
            form.append('caption', `Your quiz video (${jobId}) is ready!`);

            try {
              const response = await fetch(
                `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`,
                {
                  method: 'POST',
                  body: form,
                }
              );

              const tgResult = await response.json();

              if (response.ok && tgResult.ok) {
                console.log(`Successfully sent video for job ${jobId} to chat ${chatId} via Telegram API.`);
                telegramSentSuccessfully = true;
              } else {
                console.error(`Failed to send video via Telegram API for job ${jobId}. Status: ${response.status}, Response: ${JSON.stringify(tgResult)}`);
                telegramSentSuccessfully = false;
                telegramSendError = tgResult.description || `HTTP ${response.status}`;
              }
            } catch (fetchError) {
              console.error(`Error sending video via fetch for job ${jobId}:`, fetchError);
              telegramSentSuccessfully = false;
              telegramSendError = fetchError instanceof Error ? fetchError.message : String(fetchError);
            }
          } else {
            console.warn(`Skipping Telegram send for job ${jobId}: Missing token or chatId.`);
            telegramSendError = "Missing token or chatId";
          }

          jobs.set(jobId, {
            status: "completed",
            buffer: output.buffer,
            telegramSent: telegramSentSuccessfully,
            telegramError: telegramSendError,
            data: completedJobCheck.data,
          });
        }
      }
    } catch (error) {
      console.error(error);
      jobs.set(jobId, {
        status: "failed",
        error: error as Error,
        data: job.data,
      });
    }
  };

  const queueRender = async ({
    jobId,
    data,
  }: {
    jobId: string;
    data: JobData;
  }) => {
    jobs.set(jobId, {
      status: "queued",
      data,
      cancel: () => {
        jobs.delete(jobId);
      },
    });

    queue = queue.then(() => {
      processRender(jobId);
    });
  };

  function createJob(data: JobData) {
    const jobId = randomUUID();

    queueRender({ jobId, data });

    return jobId;
  }

  return {
    createJob,
    jobs,
  };
};

export type { JobState };

// Type guard to check if a JobState is completed and has a buffer
function isCompletedJobWithBuffer(
  job: JobState | undefined
): job is JobState & { status: "completed"; buffer: Buffer } {
  return !!job && job.status === "completed" && job.buffer instanceof Buffer;
}

export { isCompletedJobWithBuffer };
