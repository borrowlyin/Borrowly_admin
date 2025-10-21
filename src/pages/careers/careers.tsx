import React, { useEffect, useState } from "react";
import axios from "axios";
import * as Select from "@radix-ui/react-select";
import { API_BASE_URL } from "@/lib/api";
import { ChevronDown } from "lucide-react";
import { Download } from "lucide-react";
interface CareerApplication {
    id: string;
    generatedUserId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    cvUrl: string;
    assistance: string;
    privacy: boolean;
    jobRole: string;
    team: string;
    location: string;
    status: string;
    createdAt: string;
}

const Careers: React.FC = () => {
    const [applications, setApplications] = useState<CareerApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/careers`);
                const normalized = response.data.data.map((app: CareerApplication) => ({
                    ...app,
                    status: app.status.toLowerCase(),
                }));
                setApplications(normalized);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch career applications");
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, []);


    const handleDownloadCV = async (cvUrl: string) => {
        const signedUrl = await fetchSignedUrl(cvUrl);
        if (signedUrl) {
            window.open(signedUrl, "_blank");
        }
    };

    const fetchSignedUrl = async (url: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/files/sign-urls`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ urls: [url] }), // pass array of URLs
            });
            if (!res.ok) throw new Error("Failed to fetch signed URL");
            const data = await res.json();
            return data.signedUrls[0];
        } catch (err) {
            // toast({
            //   title: "Error",
            //   description: "Failed to load document.",
            //   variant: "destructive",
            // });
            return null;
        }
    };
    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await axios.put(`${API_BASE_URL}/api/careers/${id}/status`, {
                status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1),
            });

            setApplications((prev) =>
                prev.map((app) =>
                    app.id === id ? { ...app, status: newStatus } : app
                )
            );
        } catch (err) {
            console.error("Failed to update status", err);
            alert("Failed to update status");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "selected":
                return "text-green-600";
            case "pending":
                return "text-orange-500";
            case "rejected":
                return "text-red-600";
            default:
                return "text-gray-700";
        }
    };


    if (loading) return <p className="p-4">Loading...</p>;
    if (error) return <p className="p-4 text-red-600">{error}</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-4">Career Applications</h1>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                            <th className="py-2 px-4 border-b">Name</th>
                            <th className="py-2 px-4 border-b">Email</th>
                            <th className="py-2 px-4 border-b">Phone</th>
                            <th className="py-2 px-4 border-b">Job Role</th>
                            <th className="py-2 px-4 border-b">Team</th>
                            <th className="py-2 px-4 border-b">Location</th>

                            <th className="py-2 px-4 border-b">Status</th>
                            <th className="py-2 px-4 border-b">Applied On</th>
                            <th className="py-2 px-4 border-b">CV</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.map((app) => (
                            <tr
                                key={app.id}
                                className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <td className="py-2 px-4 border-b">{app.firstName} {app.lastName}</td>
                                <td className="py-2 px-4 border-b">{app.email}</td>
                                <td className="py-2 px-4 border-b">{app.phone}</td>
                                <td className="py-2 px-4 border-b">{app.jobRole}</td>
                                <td className="py-2 px-4 border-b">{app.team}</td>
                                <td className="py-2 px-4 border-b">{app.location}</td>
                                <td className="py-2 px-4 border-b">
                                    <Select.Root
                                        value={app.status.toLowerCase()}
                                        onValueChange={(val) => handleStatusChange(app.id, val)}
                                    >
                                        <Select.Trigger
                                            className={`max-w-[150px] border rounded px-2 py-1 text-sm flex justify-between items-center ${getStatusColor(app.status)}`}
                                        >
                                            <Select.Value />
                                            <ChevronDown className="w-4 h-4 ml-2 text-gray-500" />
                                        </Select.Trigger>

                                        <Select.Content className="bg-white dark:bg-gray-800 rounded shadow-lg">
                                            {["pending", "selected", "rejected"].map((statusOption) => (
                                                <Select.Item
                                                    key={statusOption}
                                                    value={statusOption}
                                                    className={`px-2 py-1 cursor-pointer ${getStatusColor(statusOption)}`}
                                                >
                                                    <Select.ItemText className="capitalize">{statusOption}</Select.ItemText>
                                                </Select.Item>
                                            ))}

                                        </Select.Content>
                                    </Select.Root>
                                </td>




                                <td className="py-2 px-4 border-b">{new Date(app.createdAt).toLocaleString()}</td>
                                <td className="py-2 px-4 border-b text-center">
                                    {app.cvUrl ? (
                                        <button
                                            onClick={() => handleDownloadCV(app.cvUrl)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <Download className="w-5 h-5 mx-auto" />
                                        </button>
                                    ) : (
                                        "-"
                                    )}
                                </td>

                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>
        </div>
    );
};

export default Careers;
