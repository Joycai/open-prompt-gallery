import Image from "next/image";

/** The adjacent wordmark supplies the name in navigation; auth pages use alt. */
export function BrandMark({ named = false }: { named?: boolean }) {
  return (
    <Image
      className="brand-mark"
      src="/brand/logo.svg"
      width={64}
      height={64}
      alt={named ? "Open Prompt Gallery" : ""}
      unoptimized
    />
  );
}
