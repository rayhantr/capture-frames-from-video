import { FFmpeg, createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import Image from "next/image";
import React, { useState } from "react";

async function createInstance() {
  const instance = createFFmpeg({
    log: true,
    corePath: new URL(`${process.env.NEXT_PUBLIC_FFMPEG_URL}/ffmpeg-core.js`, document.location as any).href,
  });

  await instance.load();

  // @ts-ignore GLOBAL EXPOSE
  global.ffmpeg = instance;

  return instance;
}

const UploadVideoComponent = () => {
  const [images, setImages] = useState<Blob[]>([]);

  const [video, setVideo] = useState<File>();

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setVideo(selectedFile);
  };

  const generateImages = async () => {
    const fileName = video?.name;
    const fileExtension = fileName?.substring(fileName?.lastIndexOf(".") + 1);

    const ffmpegInstance = await createInstance();

    if (video) {
      const inputFile = `input.${fileExtension}`;
      const interval = 3;
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
  };

  console.log("images", images);

  return (
    <div className="flex flex-col h-screen overflow-hidden items-center">
      {video && (
        <div className="h-1/2 p-4 flex flex-grow justify-center">
          <video className="max-h-full" src={URL.createObjectURL(video)} controls />
        </div>
      )}
      <div className="flex-shrink-0 p-4">
        <input type="file" id="video" accept="video/*" onChange={handleVideoChange} />
        <button className="px-4 py-1.5 bg-white text-black" onClick={generateImages}>
          Generate Images
        </button>
      </div>

      <div className="flex-shrink-0 flex gap-4 p-4 w-screen overflow-auto">
        {images?.map((image, index) => (
          <div key={index} className="relative w-60 h-32 flex-shrink-0">
            <Image src={URL.createObjectURL(image)} fill alt={`frame-${index}`} style={{ objectFit: "cover" }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadVideoComponent;

const readImageFiles = async (ffmpegInstance: FFmpeg, outputPattern: string, numFrames: number): Promise<Blob[]> => {
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
