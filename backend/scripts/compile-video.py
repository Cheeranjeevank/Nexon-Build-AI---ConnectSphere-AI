import cv2
import os
import glob
import sys

def main():
    frames_dir = '/tmp/connectsphere_frames'
    output_path = '/Users/cheeranjeevan.k/Documents/Nexoon/ConnectSphere_Demo_Walkthrough.mp4'
    fps = 25

    print(f"Reading frames from {frames_dir}...")
    files = glob.glob(os.path.join(frames_dir, 'frame_*.jpg'))
    if not files:
        print("No frames found!")
        sys.exit(1)

    # Sort numerically by frame index
    files.sort(key=lambda x: int(os.path.splitext(os.path.basename(x))[0].split('_')[1]))
    total_frames = len(files)
    print(f"Total frames to encode: {total_frames}")

    first_frame = cv2.imread(files[0])
    raw_h, raw_w, _ = first_frame.shape
    # Make sure width and height are even
    target_w = raw_w - (raw_w % 2)
    target_h = raw_h - (raw_h % 2)
    print(f"Encoding Resolution: {target_w}x{target_h} @ {fps} FPS")

    # Use avc1 / mp4v codec
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (target_w, target_h))

    for i, file in enumerate(files):
        img = cv2.imread(file)
        if img is not None:
            if img.shape[0] != target_h or img.shape[1] != target_w:
                img = cv2.resize(img, (target_w, target_h))
            out.write(img)
        if i % 250 == 0:
            print(f"Encoded frame {i}/{total_frames} ({int(i/total_frames*100)}%)")

    out.release()
    print(f"✅ Video successfully compiled to: {output_path}")

if __name__ == '__main__':
    main()
