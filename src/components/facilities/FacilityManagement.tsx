import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Plus, Edit, Eye, MapPin, Users, Clock } from "lucide-react";

interface Facility {
  id: string;
  name: string;
  type: string;
  capacity: number;
  location: string;
  status: "available" | "maintenance" | "occupied";
  description: string;
  amenities: string[];
}

const mockFacilities: Facility[] = [
  {
    id: "1",
    name: "수영장 A",
    type: "수영장",
    capacity: 50,
    location: "본관 1층",
    status: "available",
    description: "올림픽 규격 수영장으로 전문 수영 훈련에 적합합니다.",
    amenities: ["레인 8개", "전자 시간 측정", "관중석", "샤워실"]
  },
  {
    id: "2",
    name: "체육관 B",
    type: "체육관",
    capacity: 200,
    location: "동관 2층",
    status: "occupied",
    description: "다목적 체육관으로 다양한 실내 스포츠가 가능합니다.",
    amenities: ["농구 코트", "배구 네트", "음향 시설", "에어컨"]
  },
  {
    id: "3",
    name: "회의실 1",
    type: "회의실",
    capacity: 20,
    location: "관리동 3층",
    status: "available",
    description: "팀 미팅 및 전술 분석을 위한 회의실입니다.",
    amenities: ["프로젝터", "화이트보드", "Wi-Fi", "에어컨"]
  },
  {
    id: "4",
    name: "트랙 필드",
    type: "육상",
    capacity: 100,
    location: "야외",
    status: "maintenance",
    description: "400m 표준 트랙과 필드 종목 시설이 완비되어 있습니다.",
    amenities: ["400m 트랙", "필드 종목", "조명 시설", "관중석"]
  }
];

export default function FacilityManagement() {
  return null;
}