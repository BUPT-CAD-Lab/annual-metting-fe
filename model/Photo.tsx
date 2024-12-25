interface Face {
  id: string;
  file_id: string;
  file_name: string;
  target_x: number;
  target_y: number;
  target_w: number;
  target_h: number;
  flag: number;
  checkin_time: bigint;
}

interface Photo {
  file_id: string;
  file_name: string;
  faces: Face[];
}

export type { Face, Photo };
