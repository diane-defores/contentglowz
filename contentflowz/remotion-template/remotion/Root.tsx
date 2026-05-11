import { Composition } from "remotion";
import { HelloWorld, helloWorldCompSchema } from "./HelloWorld";
import { QuizVideo, quizCompSchema } from "./QuizVideo";
import { introDuration } from "./IntroText";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        // You can take the "id" to render a video:
        // npx remotion render src/index.ts <id> out/video.mp4
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={800}
        fps={30}
        width={1920}
        height={1080}
        // You can override these props for each render:
        // https://www.remotion.dev/docs/parametrized-rendering
        schema={helloWorldCompSchema}
        defaultProps={{
          titleText: "Render Server Template",
          titleColor: "#000000",
          logoColor1: "#91EAE4",
          logoColor2: "#86A8E7",
        }}
      />
      <Composition
        id="QuizVideo"
        component={QuizVideo}
        // Duration: Intro + 4 questions * 270 frames/question
        durationInFrames={introDuration + 4 * 270}
        fps={30}
        width={1080} // Vertical video format (9:16)
        height={1920}
        schema={quizCompSchema}
        // Generic placeholder questions
        defaultProps={{
          quizData: {
            questions: [
              {
                question: "Sample question 1?",
                options: ["Option A", "Option B", "Option C", "Option D"],
                correctAnswerIndex: 0,
              },
              {
                question: "Sample question 2?",
                options: ["Option A", "Option B", "Option C", "Option D"],
                correctAnswerIndex: 1,
              },
              {
                question: "Sample question 3?",
                options: ["Option A", "Option B", "Option C", "Option D"],
                correctAnswerIndex: 2,
              },
              {
                question: "Sample question 4?",
                options: ["Option A", "Option B", "Option C", "Option D"],
                correctAnswerIndex: 3,
              },
            ],
          },
        }}
      />
    </>
  );
};
