import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Image } from "@/components/ui/image";
import { api } from "@/server/api";
import { MessageSquareCheck } from "lucide-react";
import NextImage from "next/image";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = (await api.products.get()).data;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-800 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-zinc-400 dark:bg-black sm:items-start">
        <NextImage
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-accent-foreground">
            To get started, edit the page.tsx file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <NextImage
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
        <div className="flex flex-row gap-4">
          <Button>Сохранить</Button>
          <Button variant={"destructive"}>Отмена</Button>
        </div>
        <Dialog>
          <DialogTrigger>
            <MessageSquareCheck
              className="text-red-500 size-9 bg-green-400 p-2 rounded-full"
              strokeWidth={1.5}
            />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog title</DialogTitle>
            </DialogHeader>
            <p>
              Start by selecting your framework of choice. Then follow the
              instructions to install the dependencies and structure your app.
              shadcn/ui is built to work with all React frameworks.
            </p>
            <DialogFooter>
              <DialogClose>
                <Button variant={"destructive"}>Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div className=" grid grid-cols-3 gap-4">
          {products?.map((product) => (
            <div
              key={product.id}
              className="bg-zinc-900 border border-pink-600 rounded-3xl p-4 flex flex-col gap-4"
            >
              <div className=" relative w-full aspect-square rounded-3xl overflow-hidden">
                {product.image && <Image src={product.image} />}
              </div>
              <p className="text-2xl font-semibold text-white">
                {product.name}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
