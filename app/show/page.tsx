'use client';

import { Carousel } from '@material-tailwind/react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getFaces } from '../actions/getFaces';
import FaceDetectionImage from '@/component/Image';
import { Face, Photo } from '@/model/Photo';

export default function Page() {
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    function genPhoto(faces: Face[]) {
      const photos: Photo[] = [];
      faces.forEach((face) => {
        const photo = photos.find((p) => p.file_id === face.file_id);
        if (photo) {
          photo.faces.push(face);
        } else {
          photos.push({
            file_id: face.file_id,
            file_name: face.file_name,
            faces: [face],
          });
        }
      });
      setPhotos(photos);
    }

    const fetchFaces = async () => {
      try {
        const rsp = await getFaces();
        genPhoto(rsp);
      } catch (e) {
        console.error('Error fetching faces:', e);
      }
    };

    // 初次获取
    fetchFaces();

    // 定时轮询
    const interval = setInterval(() => {
      fetchFaces();
    }, 1000); // 设置轮询间隔为 1 秒

    // 清理定时器
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="flex w-screen h-screen flex-col p-2 bg-white text-black">
        <div className="flex flex-row space-x-4 py-5 items-center justify-center">
          <Image src="/cad_logo.png" alt="show" width={40} height={40}></Image>
          <div className="text-2xl font-bold">CAD 2024年 年会</div>
        </div>
        <div className="flex w-full h-full overflow-hidden">
          <Carousel
            className="flex w-full h-full"
            prevArrow={({ handlePrev }) => (
              <div onClick={handlePrev} className="hidden"></div>
            )}
            nextArrow={({ handleNext }) => (
              <div onClick={handleNext} className="hidden"></div>
            )}
            navigation={({ setActiveIndex, activeIndex, length }) => (
              <div className="absolute bottom-4 left-2/4 z-50 flex -translate-x-2/4 gap-2">
                {new Array(length).fill('').map((_, i) => (
                  <span
                    key={i}
                    className={`block h-1 cursor-pointer rounded-2xl transition-all content-[''] ${
                      activeIndex === i ? 'w-8 bg-black' : 'w-4 bg-black/50'
                    }`}
                    onClick={() => setActiveIndex(i)}
                  />
                ))}
              </div>
            )}
            autoplayDelay={5000}
            autoplay={false}
            loop={true}
            placeholder={undefined}
            transition={{
              type: 'tween',
              duration: 0.5,
            }}
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          >
            {photos.map((photo) => (
              <div
                key={photo.file_id}
                className="flex h-full w-full items-center justify-center"
              >
                <FaceDetectionImage
                  imageUrl={photo.file_name}
                  faces={photo.faces}
                />
              </div>
            ))}
          </Carousel>
        </div>
      </div>
    </>
  );
}
