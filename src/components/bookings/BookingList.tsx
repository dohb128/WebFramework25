import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../ui/dialog";
import { Eye, Edit, Trash2, Filter, Download } from "lucide-react";

interface Booking {
  id: string;
  facilityName: string;
  userName: string;
  userRole: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "pending" | "cancelled";
  purpose: string;
  participants: number;
  createdAt: string;
}

const mockBookings: Booking[] = [
  {
    id: "BK001",
    facilityName: "수영장 A",
    userName: "김선수",
    userRole: "선수",
    date: "2024-12-20",
    startTime: "09:00",
    endTime: "11:00",
    status: "confirmed",
    purpose: "수영 훈련",
    participants: 1,
    createdAt: "2024-12-18"
  },
  {
    id: "BK002",
    facilityName: "체육관 B",
    userName: "이코치",
    userRole: "코치",
    date: "2024-12-20",
    startTime: "14:00",
    endTime: "16:00",
    status: "pending",
    purpose: "팀 훈련",
    participants: 15,
    createdAt: "2024-12-19"
  },
  {
    id: "BK003",
    facilityName: "회의실 1",
    userName: "박관리자",
    userRole: "관리자",
    date: "2024-12-21",
    startTime: "10:00",
    endTime: "12:00",
    status: "confirmed",
    purpose: "전술 회의",
    participants: 8,
    createdAt: "2024-12-17"
  },
  {
    id: "BK004",
    facilityName: "트랙 필드",
    userName: "최선수",
    userRole: "선수",
    date: "2024-12-22",
    startTime: "06:00",
    endTime: "08:00",
    status: "cancelled",
    purpose: "육상 훈련",
    participants: 1,
    createdAt: "2024-12-16"
  }
];

export default function BookingList() {
  return null;
}