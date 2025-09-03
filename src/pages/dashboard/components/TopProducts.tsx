import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface LoanType {
  rank: number;
  loan_type: string;
  total_querries: number;
}


const TopProducts: React.FC = ( ) => {
  const [loanTypes, setLoanTypes] = useState<LoanType[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopLoanTypes = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("admin_token");
        const response = await fetch(
          `${API_BASE_URL}/api/dashboard/stats`, // ✅ stats API
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch top loan types");

        const data = await response.json();
        setLoanTypes(data.top_loan_types || []);
      } catch (error) {
        console.error("Error fetching top loan types:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopLoanTypes();
  }, []);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("en-IN").format(num);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Loan Enquiry Types</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4 text-center">
              <p className="text-gray-500 font-medium">Loading...</p>
              {[1, 2, 3, 4, 5].map((index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
                    <div>
                      <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-8"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : loanTypes.length > 0 ? (
            <div className="grid grid-cols-2 gap-5" onClick={()=>{navigate('/applications')}}>
              {
                loanTypes.map((loan) => (
              <div
                key={loan.rank}
                className="flex cursor-pointer items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                      {loan.rank}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{loan.loan_type}</p>
                   
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg text-gray-500">
                      <span className="font-semibold text-black">{formatNumber(loan.total_querries)}</span> enquiries
                    </p>
                </div>
              </div>
            ))
              }
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No loan types found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopProducts;
