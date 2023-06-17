import { useGenerateImages } from "@/util/ffmpeg";
import Image from "next/image";
import React, { useState } from "react";

const UploadVideoComponent = () => {
  const [video, setVideo] = useState<File>();

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setVideo(selectedFile);
  };

  const { loading, images, generate } = useGenerateImages();

  const handleGenerateImages = () => {
    generate({ video, interval: 5 });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden items-center">
      {video && (
        <div className="h-1/2 p-4 flex flex-grow justify-center">
          <video className="max-h-full" src={URL.createObjectURL(video)} controls />
        </div>
      )}
      <div className="flex-shrink-0 p-4">
        <input type="file" id="video" accept="video/*" onChange={handleVideoChange} />
        <button className="px-4 py-1.5 bg-white text-black disabled:bg-gray-400" disabled={loading} onClick={handleGenerateImages}>
          {loading ? "Generating Images" : "Generate Images"}
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
