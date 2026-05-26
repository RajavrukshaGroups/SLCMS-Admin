import { useEffect, useState } from "react";
import AdminLayout from "../../components/layout/adminLayout";
import api from "../../api/axios";
import { FiEdit, FiEye, FiTrash } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const ViewReceipts = () => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);

  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const fetchReceipts = async () => {
    try {
      const res = await api.get(
        `/admin/fetch-all-receipts?page=${page}&search=${search}`,
      );

      setReceipts(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [page, search]);

  const formatName = (name) => {
    return name?.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this receipt?"))
      return;

    try {
      await api.delete(`/admin/delete-receipt/${id}`);

      // 🔥 refresh list
      fetchReceipts();

      alert("Receipt deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting receipt");
    }
  };

  const handleExportToSheet = async () => {
    try {
      setExportLoading(true);

      toast.loading("Exporting receipt data to Google Sheet...", {
        toastId: "exportReceipts",
      });

      const res = await api.post("/admin/bulk-upload-receipts");

      toast.update("exportReceipts", {
        render: res.data.message || "Export completed successfully",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.log(err);

      toast.update("exportReceipts", {
        render: err.response?.data?.message || "Failed to export receipt data",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div
        className={`p-6 transition duration-200 ${
          exportLoading ? "blur-sm pointer-events-none select-none" : ""
        }`}
      >
        {" "}
        {/* 🔥 HEADER */}
        {/* <h1 className="text-2xl font-bold text-green-800 mb-4">All Receipts</h1> */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-green-800">All Receipts</h1>

          {/* <button
            onClick={handleExportToSheet}
            disabled={exportLoading}
            className={`px-5 py-2 rounded-lg text-white font-semibold shadow transition ${
              exportLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-700 hover:bg-green-800"
            }`}
          >
            {exportLoading
              ? "Exporting To Google Sheet..."
              : "Export To Google Sheet"}
          </button> */}
        </div>
        {/* 🔍 SEARCH */}
        <input
          type="text"
          placeholder="Search by name / receipt no / course"
          className="w-full mb-4 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        {/* 📋 TABLE */}
        <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-green-700 text-white">
              <tr>
                <th className="p-3 text-left">Receipt No</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Course</th>
                <th className="p-3 text-left">Year</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Action</th>
                <th className="p-3">View</th>
              </tr>
            </thead>

            <tbody>
              {receipts.length > 0 ? (
                receipts.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b hover:bg-green-50 transition"
                  >
                    <td className="p-3 font-medium text-green-800">
                      {item.receiptNumber}
                    </td>
                    <td className="p-3">{formatName(item.name)}</td>
                    <td className="p-3">{item.course}</td>
                    <td className="p-3">{item.year}</td>
                    <td className="p-3 font-semibold text-green-700">
                      ₹ {item.totalAmount}
                    </td>
                    <td className="p-3">
                      <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs font-medium">
                        {formatDate(item.receiptDate)}
                      </span>
                    </td>

                    {/* ✏️ EDIT */}
                    <td className="p-3 flex gap-3">
                      {/* EDIT */}
                      <button
                        onClick={() =>
                          navigate(`/admin/generate-receipt/${item._id}`)
                        }
                        className="text-green-700 hover:text-green-900"
                      >
                        <FiEdit size={18} />
                      </button>

                      {/* DELETE */}
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FiTrash size={18} />
                      </button>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() =>
                          window.open(
                            // `http://localhost:11000/admin/view-receipt/${item._id}`,
                            `https://server.bouncyboxstudio.in/admin/view-receipt/${item._id}`,
                            "_blank",
                          )
                        }
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FiEye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center p-4 text-gray-500">
                    No receipts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* 🔥 PAGINATION */}
        <div className="flex justify-center mt-4 gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="px-4 py-1 font-medium">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
      {exportLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
          <div className="bg-white px-6 py-5 rounded-xl shadow-2xl flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>

            <p className="text-green-800 font-semibold text-lg">
              Exporting Data To Google Sheet...
            </p>

            <p className="text-gray-500 text-sm mt-1">Please wait</p>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ViewReceipts;
