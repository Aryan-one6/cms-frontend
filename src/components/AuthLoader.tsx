import { useEffect, useState } from "react";
import Lottie from "lottie-react";

export default function AuthLoader() {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    let active = true;
    fetch("/Paperwork_Black.json")
      .then((res) => res.json())
      .then((data) => {
        if (active) setAnimationData(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/85 backdrop-blur">
      {animationData ? (
        <Lottie animationData={animationData} loop autoplay className="h-24 w-24 sm:h-32 sm:w-32" />
      ) : (
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      )}
    </div>
  );
}
