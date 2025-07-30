import { cn } from "@/lib/utils";

export const GridBackground = ({
  className,
  size = 40,
}: {
  className?: string;
  size?: number;
}) => {
  return (
    <div
      className={cn(
        "absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px]",
        className
      )}
      style={{
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  );
};

export const GridSmallBackground = ({
  className,
  size = 20,
}: {
  className?: string;
  size?: number;
}) => {
  return (
    <div
      className={cn(
        "absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]",
        className
      )}
      style={{
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  );
};

export const DotBackground = ({
  className,
  size = 20,
}: {
  className?: string;
  size?: number;
}) => {
  return (
    <div
      className={cn(
        "absolute inset-0 bg-dot-white/[0.02] bg-[size:20px_20px]",
        className
      )}
      style={{
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  );
};
