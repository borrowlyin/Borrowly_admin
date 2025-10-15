import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/api";

interface LoanType {
  rank: number;
  loan_type: string;
  total_querries: number;
  statusCounts: {
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
  };
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-200 text-gray-700",
};

const TopProducts: React.FC = () => {
  const [loanTypes, setLoanTypes] = useState<LoanType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopLoanTypes = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("admin_token");
        const response = await fetch(`${API_BASE_URL}/api/dashboard-data`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        const loansArray: LoanType[] = Object.entries(data.loans).map(
          ([loanTypeKey, loanData], index) => ({
            rank: index + 1,
            loan_type: loanTypeKey
              .replace("_", " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()),
            total_querries: loanData.totalApplicants ?? 0,
            statusCounts:
              loanData.statusCounts ?? {
                pending: 0,
                approved: 0,
                rejected: 0,
                cancelled: 0,
              },
          })
        );

        setLoanTypes(loansArray);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopLoanTypes();
  }, []);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("en-IN").format(num);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Total Loan Enquiry Types</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-gray-500 text-center py-10">Loading...</p>
        ) : loanTypes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {loanTypes.map((loan) => (
              <div
                key={loan.rank}
                className="bg-white rounded-xl shadow hover:shadow-lg transition-transform transform hover:scale-[1.02] p-5 border border-gray-100"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {loan.loan_type}
                  </h3>
                 
                </div>

                <p className="text-gray-700 mb-4">
                  <span className="font-medium">
                    {formatNumber(loan.total_querries)}
                  </span>{" "}
                  total enquiries
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(loan.statusCounts).map(([status, count]) => (
                    <div
                      key={status}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg ${statusColors[status]}`}
                    >
                      <p className="font-semibold capitalize">{status}</p>
                      <p className="text-lg font-bold">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-10">
            No loan types found
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default TopProducts;
