import { useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { Button, Page, Spinner } from "zmp-ui";

import { ApiError, Pet, listPets } from "@/api/client";
import ErrorDetail from "@/components/error-detail";
import { errorText, sessionAtom, toApiError } from "@/state/session";

type PetsState =
  | { status: "loading" }
  | { status: "error"; error: ApiError }
  | { status: "ready"; pets: Pet[] };

// A first cut of screen 1 (Template D): greeting and the owner's pets.
// The two-sided card, tabs and add-pet flow come in later steps.
function HomePage() {
  const session = useAtomValue(sessionAtom);
  const [pets, setPets] = useState<PetsState>({ status: "loading" });

  const load = useCallback(() => {
    setPets({ status: "loading" });
    listPets()
      .then((list) => setPets({ status: "ready", pets: list }))
      .catch((error) => setPets({ status: "error", error: toApiError(error) }));
  }, []);

  useEffect(load, [load]);

  const name = session.status === "ready" ? session.user.name : null;

  return (
    <Page className="page flex flex-col gap-4">
      <div>
        <p className="text-[22px] font-semibold leading-tight tracking-tight">
          {name ? `Chào ${name}` : "Chào bạn"}
        </p>
        {pets.status === "ready" && (
          <p className="mt-0.5 text-[13px] text-muted">
            {pets.pets.length > 0
              ? `${pets.pets.length} thú cưng trong ví`
              : "Ví thẻ của bạn đang trống"}
          </p>
        )}
      </div>

      {pets.status === "loading" && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {pets.status === "error" && (
        <div className="flex flex-col items-center gap-3 rounded-group bg-white p-5 text-center shadow-[0_0_0_1px_#DCEBE7]">
          <p className="text-muted">{errorText(pets.error)}</p>
          <ErrorDetail error={pets.error} />
          <Button size="small" onClick={load}>
            Thử lại
          </Button>
        </div>
      )}

      {pets.status === "ready" && pets.pets.length === 0 && (
        <div className="rounded-group bg-white p-5 text-center shadow-[0_0_0_1px_#DCEBE7]">
          <p className="font-medium">Chưa có thú cưng nào</p>
          <p className="mt-1 text-[13px] text-muted">
            Thêm bé đầu tiên để làm thẻ và nhận nhắc lịch tiêm.
          </p>
        </div>
      )}

      {pets.status === "ready" && pets.pets.length > 0 && (
        <section>
          <h2 className="mx-0.5 mb-2 text-[15.5px] font-medium">Thú cưng của bạn</h2>
          <div className="overflow-hidden rounded-group bg-white shadow-[0_0_0_1px_#DCEBE7]">
            {pets.pets.map((pet, index) => (
              <PetRow key={pet.id} pet={pet} first={index === 0} />
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}

function PetRow({ pet, first }: { pet: Pet; first: boolean }) {
  const details = [pet.species, pet.breed].filter(Boolean).join(" · ");
  return (
    <div className={`flex min-h-[52px] items-center gap-3 px-3.5 py-3 ${first ? "" : "border-t border-line"}`}>
      <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-mint font-semibold text-teal">
        {pet.name.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <b className="block truncate font-medium leading-tight">{pet.name}</b>
        <span className="block truncate text-[12.5px] text-muted">{details}</span>
      </div>
    </div>
  );
}

export default HomePage;
