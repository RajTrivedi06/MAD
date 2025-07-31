import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export const Card = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardTitle = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  return (
    <h3
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className
      )}
    >
      {children}
    </h3>
  );
};

export const CardDescription = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
  );
};

export const CardSkeletonContainer = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  return <div className={cn("p-6", className)}>{children}</div>;
};

export const Container = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  return (
    <div
      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) => {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardContent = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>;
};
