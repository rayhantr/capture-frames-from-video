import { FFmpeg, createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { useState } from "react";

export async function createInstance() {
  const instance = createFFmpeg({
    log: true,
    corePath: new URL(`${process.env.NEXT_PUBLIC_FFMPEG_URL}/ffmpeg-core.js`, document.location as any).href,
  });

  await instance.load();

  return instance;
}

export const readImageFiles = async (ffmpegInstance: FFmpeg, outputPattern: string, numFrames: number): Promise<Blob[]> => {
  const imageFiles: Blob[] = [];

  for (let i = 1; i <= numFrames; i++) {
    const fileNumber = i.toString().padStart(3, "0"); // Convert frame number to padded string
    const fileName = outputPattern.replace("%03d", fileNumber);
    const fileData = ffmpegInstance.FS("readFile", fileName);
    const blob = new Blob([fileData.buffer], { type: "image/jpeg" }); // Specify the appropriate MIME type based on the image format
    imageFiles.push(blob);
  }

  return imageFiles;
};

export const useGenerateImages = () => {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<Blob[]>([]);

  return {
    loading,
    images,
    generate: async ({ video, interval = 5 }: GenerateImages) => {
      setLoading(true);
      const ffmpegInstance = await createInstance();

      if (video) {
        const fileName = video.name;
        const fileExtension = fileName.substring(fileName?.lastIndexOf(".") + 1);
        const inputFile = `input.${fileExtension}`;
        const outputPattern = "output-%03d.png";
        ffmpegInstance.FS("writeFile", inputFile, await fetchFile(video));
        const args = [
          "-i",
          inputFile,
          "-vf",
          `fps=1/${interval}`, // Set the desired frame rate
          "-q:v",
          "2", // Set the quality of the output images (0 to 31, 0 being the best)
          "-c:v",
          "png", // Specify the encoder for the output format
          outputPattern,
        ];

        // Run FFmpeg command
        await ffmpegInstance.run(...args);

        // Get the number of frames
        const frameCount = ffmpegInstance.FS("readdir", ".").filter((file) => file?.startsWith("output")).length;

        setImages(await readImageFiles(ffmpegInstance, outputPattern, frameCount));
      }
      setLoading(false);
    },
  };
};

interface GenerateImages {
  video: File | undefined;
  interval?: number;
}
