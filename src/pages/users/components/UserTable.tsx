import React, { useEffect, useState } from "react";
import { Edit } from "lucide-react";
import {
  GetCountries,
  GetState,
} from "react-country-state-city";
import "react-country-state-city/dist/react-country-state-city.css";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  guide_code: string;
  created_at?: string;
  country?: string;
  state?: string;
  is_email_verified: boolean;
  last_purchased_package: string;
  customer_image: string | null;
}

interface UserTableProps {
  searchTerm: string;
}

export const UserTable: React.FC<UserTableProps> = ({ searchTerm }) => {
  const [stateList, setStateList] = useState([]);
  const [countryList, setCountryList] = useState([]);
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editData, setEditData] = useState({ name: "", email: "", phone: "", state: "" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const limit = 10;

  useEffect(() => {
    GetCountries().then((result) => {
      setCountryList(result);
      const india = result.find((c) => c.name === "India");
      if (india) {
        GetState(india.id).then((states) => {
          setStateList(states);
        });
      }
    });
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("admin_token");
        const res = await fetch(
          `${API_BASE_URL}/api/v1/admin/users/UserInfo?page=${page}&limit=${limit}&search=${searchTerm}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch users");

        setUsers(data.results || []);
        setTotalUsers(data.total || 0);
      } catch (error: any) {
        setError(error.message || "Failed to fetch customer info");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [page, searchTerm]);

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditData({
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      phone: user.phone || "",
      state: user.state || "",
    });
    setIsDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    const [first_name, ...rest] = editData.name.trim().split(" ");
    const last_name = rest.join(" ") || "";

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `${API_BASE_URL}/api/v1/admin/users/UpdateCustomerprofile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: selectedUser.id,
            first_name,
            last_name,
            email: editData.email,
            phone: editData.phone,
            state: editData.state,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "Update failed");

      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                first_name,
                last_name,
                email: editData.email,
                phone: editData.phone,
                state: editData.state,
              }
            : u
        )
      );
      setIsDialogOpen(false);
      toast.success("User updated successfully.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong.");
    }
  };

  const totalPages = Math.ceil(totalUsers / limit);

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading users...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Purchased Package</TableHead>
                <TableHead>Guide Code</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {user.customer_image ? (
                        <img
                          src={user.customer_image}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <Avatar>
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                            {`${user.first_name[0] || ""}${user.last_name[0] || ""}`}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.last_purchased_package || "-"}</TableCell>
                  <TableCell>{user.guide_code}</TableCell>
                  <TableCell>{user.phone || "N/A"}</TableCell>
                  <TableCell>
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>{user.state || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end items-center p-4 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                name="name"
                value={editData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                name="email"
                value={editData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                name="phone"
                value={editData.phone}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <select
                name="state"
                value={editData.state}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, state: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded-md"
              >
                <option value="">Select State</option>
                {stateList.map((state: any) => (
                  <option key={state.id} value={state.name}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
