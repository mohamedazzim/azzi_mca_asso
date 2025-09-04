import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { getFormattedBatchOptions } from "@/lib/batch-utils";

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  batch: string;
  section: string;
  photo: string;
}

interface StudentSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selected: Student[]) => void;
}

export const StudentSelectionModal: React.FC<StudentSelectionModalProps> = ({ open, onClose, onConfirm }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batch, setBatch] = useState<string>("all");
  const [section, setSection] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (batch !== "all") params.append("batch", batch);
        if (section !== "all") params.append("section", section);
        if (search) params.append("search", search);
        params.append("pageSize", "1000"); // fetch all for selection
        const res = await fetch(`/api/students?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setStudents(data.students || []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [open, batch, section, search]);

  useEffect(() => {
    if (selectAll) {
      setSelectedIds(students.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
    // eslint-disable-next-line
  }, [selectAll, students]);

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onConfirm(students.filter((s) => selectedIds.includes(s.id)));
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Students</DialogTitle>
          <DialogDescription>
            Filter and select students for event participation.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 mb-2">
          <select value={batch} onChange={e => setBatch(e.target.value)} className="border rounded px-2 py-1">
            <option value="all">All Batches</option>
            {getFormattedBatchOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}


          </select>
          <select value={section} onChange={e => setSection(e.target.value)} className="border rounded px-2 py-1">
            <option value="all">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
          </select>
          <Input
            placeholder="Search by name or roll..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-48"
          />
          <Button type="button" variant="outline" onClick={() => setSelectAll(!selectAll)}>
            {selectAll ? "Deselect All" : "Select All"}
          </Button>
        </div>
        <div className="overflow-y-auto max-h-96 border rounded">
          {loading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : students.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No students found.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2">Select</th>
                  <th className="p-2">Photo</th>
                  <th className="p-2">Roll</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Batch</th>
                  <th className="p-2">Section</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(student.id)}
                        onChange={() => handleSelect(student.id)}
                      />
                    </td>
                    <td className="p-2 text-center">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.photo} alt={student.name} />
                        <AvatarFallback>{student.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                    </td>
                    <td className="p-2">{student.rollNumber}</td>
                    <td className="p-2">{student.name}</td>
                    <td className="p-2">{student.batch}</td>
                    <td className="p-2">{student.section}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleConfirm} disabled={selectedIds.length === 0}>
            Confirm Selection ({selectedIds.length})
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 