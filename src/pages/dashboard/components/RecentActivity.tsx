import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const activities = [
  {
    id: 1,
    type: "order",
    user: "John Smith",
    action: "placed a new order",
    amount: "₹129.99",
    time: "2 minutes ago",
    status: "pending",
  },
  {
    id: 2,
    type: "user",
    user: "Sarah Johnson",
    action: "created a new account",
    time: "15 minutes ago",
    status: "new",
  },
  {
    id: 3,
    type: "order",
    user: "Mike Davis",
    action: "completed payment",
    amount: "₹89.50",
    time: "1 hour ago",
    status: "completed",
  },
  {
    id: 4,
    type: "product",
    user: "Admin",
    action: "updated product inventory",
    time: "2 hours ago",
    status: "updated",
  },
  {
    id: 5,
    type: "order",
    user: "Emily Wilson",
    action: "requested refund",
    amount: "₹156.00",
    time: "3 hours ago",
    status: "refund",
  },
];

export const RecentActivity: React.FC = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "new":
        return "bg-blue-100 text-blue-800";
      case "refund":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                  {activity.user
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.user}
                  </p>
                  <Badge
                    className={`text-xs ${getStatusColor(activity.status)}`}
                  >
                    {activity.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">
                  {activity.action}
                  {activity.amount && (
                    <span className="font-medium text-gray-900 ml-1">
                      {activity.amount}
                    </span>
                  )}
                </p>
              </div>
              <div className="text-sm text-gray-500">{activity.time}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
