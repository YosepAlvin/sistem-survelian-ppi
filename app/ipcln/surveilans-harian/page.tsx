import { redirect } from "next/navigation"

export default function SurveilansHarianIndex() {
  // Redirect to patient list because surveillance is done per patient
  redirect("/ipcln/pasien")
}
