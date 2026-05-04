import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";

export const metadata = {
    title: "Dashboard - AHB26",
    description: "Manage your workspace and connectors",
};

export default async function DashboardPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    return <Dashboard />;
}
