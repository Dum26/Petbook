"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pet, Profile } from "@/types/petbook";
interface PetContextType { myPets: Pet[]; activePet: Pet | null; setActivePet: (pet: Pet | null) => void; profile: Profile | null; user: any; }
const PetContext = createContext<PetContextType>({ myPets: [], activePet: null, setActivePet: () => {}, profile: null, user: null });
export function PetProvider({ children, initialPets = [], initialProfile = null, initialUser = null, initialActivePetId }: { children: React.ReactNode; initialPets?: Pet[]; initialProfile?: Profile | null; initialUser?: any; initialActivePetId?: string }) {
  const router = useRouter();
  const [activePet, selectPet] = useState<Pet | null>(initialPets.find(pet => pet.id === initialActivePetId) || initialPets[0] || null);
  useEffect(() => { selectPet(initialPets.find(pet => pet.id === initialActivePetId) || initialPets[0] || null); }, [initialPets, initialActivePetId]);
  const setActivePet = (pet: Pet | null) => {
    const owned = initialPets.find(item => item.id === pet?.id) || pet;
    selectPet(owned);
    document.cookie = "petbook_active_pet_id=" + (owned?.id || "") + "; path=/; SameSite=Lax; max-age=" + (owned ? 31536000 : 0) + (location.protocol === "https:" ? "; Secure" : "");
    router.refresh();
  };
  return <PetContext.Provider value={{ myPets: initialPets, activePet, setActivePet, profile: initialProfile, user: initialUser }}>{children}</PetContext.Provider>;
}
export function usePet() { return useContext(PetContext); }
