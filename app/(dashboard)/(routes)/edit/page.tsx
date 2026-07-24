"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil } from "lucide-react";
import { Heading } from "@/components/heading";
import { LibraryGate, useLibraryPath } from "@/components/library-gate";
import { QUERY, ROUTES } from "@/constants";

const EditHub = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const libraryPath = useLibraryPath();
  const filter = searchParams.get("filter");

  useEffect(() => {
    if (!libraryPath) return;
    const qs = new URLSearchParams();
    if (filter === QUERY.incompleteFilter) qs.set("filter", QUERY.incompleteFilter);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    router.replace(`${ROUTES.editPage}${suffix}`);
  }, [libraryPath, filter, router]);

  if (!libraryPath) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Heading
          title="Edit Music Files"
          description="Set a library folder to start editing tags"
          icon={Pencil}
          iconColor="text-orange-700"
          otherProps="mb-8"
        />
        <div className="px-4 lg:px-8">
          <LibraryGate
            onReady={() => {
              const qs =
                filter === QUERY.incompleteFilter
                  ? `?filter=${QUERY.incompleteFilter}`
                  : "";
              router.replace(`${ROUTES.editPage}${qs}`);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-12 text-sm text-muted-foreground lg:px-8">
      Opening library…
    </div>
  );
};

export default EditHub;
