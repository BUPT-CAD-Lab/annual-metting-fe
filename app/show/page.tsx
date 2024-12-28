'use client';

import FaceDetectionImage from '@/component/Image';
import { Face, Photo } from '@/model/Photo';
import { Carousel } from '@material-tailwind/react';
import assert from 'assert';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { getFaces } from '../actions/getFaces';

const defaultPhoto: Photo = {
  id: 0,
  file_id: '-1',
  file_name: '/default.jpeg',
  faces: [],
} as Photo;

export default function Page() {
  const initPhotos: Photo[] = [];
  for (let i = 0; i < 10; i++) {
    initPhotos.push(defaultPhoto);
  }

  const [photos, setPhotos] = useState<Photo[]>(initPhotos);
  const currentIndex = useRef(0);
  const photosQueue = useRef<Photo[]>([]);
  const photosQueuePointer = useRef<number>(0);
  const lastCheckinTime = useRef<bigint>(0n);
  const ref = useRef<HTMLDivElement>(null);

  const updateNextPhoto = (activeIndex: number) => {
    const nextIndex = (activeIndex + 1) % photos.length;
    if (
      (nextIndex === 0 && photosQueue.current.length >= 9) ||
      photosQueue.current.length === 0 ||
      (photosQueue.current.length < 9 &&
        nextIndex % (photosQueue.current.length + 1) === 0)
    ) {
      photos[nextIndex] = defaultPhoto;
    } else {
      photos[nextIndex] = photosQueue.current[photosQueuePointer.current];
      photosQueuePointer.current =
        (photosQueuePointer.current + 1) % photosQueue.current.length;
    }
    setPhotos([...photos]);
    currentIndex.current = activeIndex;
  };

  const updateQueue = (newPhotoRecords: Photo[]) => {
    // 排序：根据 last face 的 checkin_time 从小到大排序
    newPhotoRecords.sort((a, b) => {
      assert(a.faces.length > 0 && b.faces.length > 0);
      const a_time = a.faces[a.faces.length - 1].checkin_time;
      const b_time = b.faces[b.faces.length - 1].checkin_time;
      if (a_time < b_time) {
        return -1;
      } else if (a_time > b_time) {
        return 1;
      } else {
        return 0;
      }
    });

    const fileIDSet = new Set<string>();
    newPhotoRecords.forEach((photo) => {
      fileIDSet.add(photo.file_id);
    });

    // 未被重新签到的图片
    const oldPhotos = photosQueue.current.filter((photo) => {
      return !fileIDSet.has(photo.file_id);
    });

    const newQueue = oldPhotos.concat(newPhotoRecords);

    // 更新指针 如果新增加的签到记录第一张正在展示需要特殊处理
    if (photos[currentIndex.current].file_id === newPhotoRecords[0].file_id) {
      photosQueuePointer.current = (oldPhotos.length + 1) % newQueue.length;
    } else {
      photosQueuePointer.current = oldPhotos.length;
    }

    // 合并
    photosQueue.current = oldPhotos.concat(newPhotoRecords);
  };

  useEffect(() => {
    // 定时轮训数据库
    function genPhoto(faces: Face[]) {
      if (faces.length === 0) {
        setPhotos([...initPhotos]);
        photosQueue.current = [];
        photosQueuePointer.current = 0;
        lastCheckinTime.current = 0n;
        return;
      }

      const newPhotoRecords: Photo[] = [];

      let nextCheckinTime = lastCheckinTime.current;
      faces
        .filter((face) => face.checkin_time > lastCheckinTime.current)
        .forEach((face) => {
          if (face.checkin_time > nextCheckinTime) {
            nextCheckinTime = face.checkin_time;
          }
          const photo = newPhotoRecords.find((p) => p.file_id === face.file_id);
          if (photo) {
            photo.faces.push(face);
          } else {
            newPhotoRecords.push({
              file_id: face.file_id,
              file_name: face.file_name,
              faces: [face],
            });
          }
        });

      lastCheckinTime.current = nextCheckinTime;

      if (newPhotoRecords.length === 0) {
        return;
      }

      // 将新增的签到记录合并到原来的db中
      updateQueue(newPhotoRecords);
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
    }, 2500); // 设置轮询间隔为 1 秒

    const slider = setInterval(() => {
      ref.current?.click();
    }, 5000); // 设置轮播间隔为 3 秒

    // 清理定时器
    return () => {
      clearInterval(interval);
      clearInterval(slider);
    };
  }, []);

  return (
    <>
      <div className="flex w-screen h-screen flex-col bg-white p-2 text-black">
        <div className="flex flex-row space-x-4 pt-2 pb-2 items-center justify-center">
          <Image src="/cad_logo.png" alt="show" width={40} height={40}></Image>
          <div className="text-2xl font-bold">
            北京邮电大学PCN&CAD中心 2024 年会
          </div>
        </div>
        <div className="flex w-full h-full overflow-hidden">
          <Carousel
            className="flex w-full h-full"
            prevArrow={({ handlePrev, activeIndex }) => (
              <div
                onClick={() => {
                  handlePrev();
                  updateNextPhoto(activeIndex);
                }}
                className="hidden"
              ></div>
            )}
            nextArrow={({ handleNext, activeIndex }) => (
              <div
                ref={ref}
                onClick={() => {
                  handleNext();
                  updateNextPhoto(activeIndex);
                }}
                className="hidden"
              ></div>
            )}
            navigation={({ setActiveIndex, activeIndex, length }) => (
              <div className="absolute bottom-4 left-2/4 z-50 flex -translate-x-2/4 gap-2">
                {new Array(length).fill('').map((_, i) => (
                  <span
                    key={i}
                    className={`block h-1 cursor-pointer backdrop-invert rounded-full transition-all content-[''] ${
                      activeIndex === i ? 'w-8 bg-black/50' : 'w-4 bg-white/50'
                    }`}
                    onClick={() => setActiveIndex(i)}
                  />
                ))}
              </div>
            )}
            autoplay={true}
            autoplayDelay={5000}
            loop={true}
            placeholder={undefined}
            transition={{
              type: 'tween',
              duration: 0.5,
            }}
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          >
            {photos.length > 0 ? (
              photos.map((photo) => (
                <div
                  key={photo.file_id}
                  className="flex h-full w-full items-center justify-center"
                >
                  <FaceDetectionImage
                    imageUrl={photo.file_name}
                    faces={photo.faces}
                  />
                </div>
              ))
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <FaceDetectionImage imageUrl={'/default.jpeg'} faces={[]} />
              </div>
            )}
          </Carousel>
        </div>
      </div>
    </>
  );
}
