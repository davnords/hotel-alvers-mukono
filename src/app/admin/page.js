import AdminApp from "@/components/booking/AdminApp";

export const metadata = {
  title: "Admin – Hotel Alvers bookings",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminApp />;
}
