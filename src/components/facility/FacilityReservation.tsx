import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Loader2, MapPin, Users } from "lucide-react";

export interface Facility {
  facility_id: number;
  code: string;
  name: string;
  category: string;
  capacity: number;
  location: string;
  is_active: boolean;
}

interface FacilityReservationProps {
  onSelectFacility?: (facility: Facility) => void;
}

export default function FacilityReservation({
  onSelectFacility,
}: FacilityReservationProps) {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchFacilities = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("facilities")
        .select("facility_id, code, name, category, capacity, location, is_active")
        .order("name", { ascending: true });

      if (!isMounted) {
        return;
      }

      if (fetchError) {
        console.error("Failed to load facilities", fetchError);
        setError("Failed to load facilities. Please try again.");
        setFacilities([]);
      } else {
        setFacilities(data ?? []);
      }

      setLoading(false);
    };

    fetchFacilities();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredFacilities = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return facilities.filter((facility) => {
      const matchesSearch = term
        ? facility.name.toLowerCase().includes(term) ||
          facility.code.toLowerCase().includes(term)
        : true;

      const matchesStatus = onlyActive ? facility.is_active : true;

      return matchesSearch && matchesStatus;
    });
  }, [facilities, searchTerm, onlyActive]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4 text-sm">Loading facilities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive bg-destructive/10 p-6 text-center text-destructive">
        {error}
      </div>
    );
  }

  if (filteredFacilities.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search facility name or code"
            className="max-w-xs"
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(event) => setOnlyActive(event.target.checked)}
            />
            Show active facilities only
          </label>
        </div>
        <div className="rounded-md border bg-white p-6 text-center text-muted-foreground">
          No facilities found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search facility name or code"
          className="max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={(event) => setOnlyActive(event.target.checked)}
          />
          Show active facilities only
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredFacilities.map((facility) => (
          <Card
            key={facility.facility_id}
            className="p-4 shadow-sm transition hover:shadow-md"
          >
            <CardHeader className="p-0">
              <Badge variant={facility.is_active ? "secondary" : "outline"}>
                {facility.is_active ? "Active" : "Inactive"}
              </Badge>
              <CardTitle className="mt-2 text-lg">{facility.name}</CardTitle>
            </CardHeader>
            <CardContent className="mt-4 grid gap-2 p-0 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Capacity: {facility.capacity}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{facility.location}</span>
              </div>
              <div>Category: {facility.category}</div>
              <div>Code: {facility.code}</div>
            </CardContent>
            {onSelectFacility && (
              <Button
                className="mt-4 w-full"
                disabled={!facility.is_active}
                onClick={() => onSelectFacility(facility)}
              >
                {facility.is_active ? "Reserve" : "Unavailable"}
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
