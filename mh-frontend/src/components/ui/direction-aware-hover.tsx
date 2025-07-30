"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { ReactNode, useState } from "react";

export const DirectionAwareHover = ({
  imageUrl,
  children,
  childrenClassName,
  imageClassName,
  className,
}: {
  imageUrl: string;
  children: ReactNode | string;
  childrenClassName?: string;
  imageClassName?: string;
  className?: string;
}) => {
  const [direction, setDirection] = useState<string | null>(null);

  const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = event.clientX - centerX;
    const mouseY = event.clientY - centerY;

    const angle = Math.atan2(mouseY, mouseX) * (180 / Math.PI);
    let direction = "";

    if (angle >= -45 && angle <= 45) direction = "right";
    else if (angle > 45 && angle <= 135) direction = "down";
    else if (angle > 135 || angle <= -135) direction = "left";
    else direction = "up";

    setDirection(direction);
  };

  const handleMouseLeave = () => {
    setDirection(null);
  };

  return (
    <div
      className={cn(
        "md:h-96 w-60 h-60 bg-transparent rounded-lg flex items-center justify-center",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative w-full h-full overflow-hidden rounded-lg">
        <div
          className={cn(
            "w-full h-full bg-cover bg-center transition-all duration-500 ease-out",
            imageClassName
          )}
          style={{
            backgroundImage: `url(${imageUrl})`,
          }}
        />
        <div
          className={cn(
            "absolute inset-0 bg-black/40 flex items-center justify-center",
            childrenClassName
          )}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: direction ? 1 : 0,
              y: direction ? 0 : 20,
            }}
            transition={{ duration: 0.2 }}
            className="text-white text-center"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
