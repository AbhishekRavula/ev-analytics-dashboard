import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Title, List, ListItem } from "@tremor/react";
import { fetchEVData, EVData } from "../services/api";
import { DonutChart } from "./common/DonutChart";
import { BarChart } from "./common/BarChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./common/Select";
import { Label } from "./common/Label";
import { BarList } from "./common/BarList";
import clsx from "clsx";
import { chartColors } from "../lib/chartUtils";
import { Button } from "./common/Button";
import { AreaChart } from "./common/AreaChart";

export default function Dashboard() {
  const [selectedCounty, setSelectedCounty] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [rangeManufacturer, setRangeManufacturer] = useState("");
  const [rangeModel, setRangeModel] = useState("");

  const {
    data: evData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["evData"],
    queryFn: fetchEVData,
  });

  // Filters Logic
  const filteredData = useMemo(() => {
    if (!evData) return [];
    return evData.filter((car: EVData) => {
      const matchesCounty = selectedCounty
        ? car.County === selectedCounty
        : true;
      const matchesCity = selectedCity ? car.City === selectedCity : true;
      return matchesCounty && matchesCity;
    });
  }, [evData, selectedCity, selectedCounty]);

  // 1. Top Manufacturers Data
  const topManufacturers = useMemo(() => {
    const makersDistributionData = filteredData.reduce((acc, car) => {
      acc[car.Make] = (acc[car.Make] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topMakersChartData = Object.entries(makersDistributionData)
      .map(([make, count]) => ({ name: make, value: count }))
      .sort((a, b) => b.value - a.value);

    const totalCarsMade = topMakersChartData.reduce(
      (acc, { value }) => acc + value,
      0
    );

    const topFourMakers = topMakersChartData.slice(0, 4).map((make) => ({
      ...make,
      share: (make.value / totalCarsMade) * 100,
    }));

    const otherCarsMade = topMakersChartData
      .slice(4)
      .reduce((acc, { value }) => acc + value, 0);

    if (otherCarsMade > 0) {
      topFourMakers.push({
        name: "Others",
        value: otherCarsMade,
        share: 100 - topFourMakers.reduce((acc, { share }) => acc + share, 0),
      });
    }

    return { data: topFourMakers, totalCarsMade };
  }, [filteredData]);

  // 2. Top Models Data
  const topModelsData = useMemo(() => {
    const modelData = filteredData.reduce((acc, car) => {
      acc[car.Model] = (acc[car.Model] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(modelData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([model, count]) => ({
        model: model,
        vehicles: count,
      }));
  }, [filteredData]);

  const uniqueCounties = useMemo(() => {
    return Array.from(new Set(evData?.map((car) => car.County) || []));
  }, [evData]);

  const uniqueCities = useMemo(() => {
    if (!selectedCounty || !evData) return [];
    return Array.from(
      new Set(
        evData
          .filter((car) => car.County === selectedCounty)
          .map((car) => car.City)
      )
    );
  }, [selectedCounty, evData]);

  const allManufacturers = useMemo(() => {
    const manufacturers = filteredData.map((car) => car.Make);
    return Array.from(new Set(manufacturers));
  }, [filteredData]);

  const modelsByManufacturer = useMemo(() => {
    const models = filteredData
      .filter((car) => car.Make === rangeManufacturer)
      .map((car) => car.Model);
    return Array.from(new Set(models));
  }, [filteredData, rangeManufacturer]);

  // 3. EV Range Data
  const evRangeData = useMemo(() => {
    const uniqueYearRangeMap: { [year: string]: string } = {};

    filteredData
      .filter(
        (car) => car.Make === rangeManufacturer && car.Model === rangeModel
      )
      .forEach((car) => {
        if (!uniqueYearRangeMap[car["Model Year"]]) {
          uniqueYearRangeMap[car["Model Year"]] = car["Electric Range"];
        }
      });

    return Object.keys(uniqueYearRangeMap)
      .map((year) => ({
        year: parseInt(year, 10),
        range: parseInt(uniqueYearRangeMap[year]),
      }))
      .sort((a, b) => a.year - b.year);
  }, [filteredData, rangeManufacturer, rangeModel]);

  // 4. Fuel Eligibility
  const fuelEligibilityData = useMemo(() => {
    const fuelEligibilityData = filteredData.reduce((acc, car) => {
      const eligibilityKey =
        car["Clean Alternative Fuel Vehicle (CAFV) Eligibility"] ===
        "Clean Alternative Fuel Vehicle Eligible"
          ? "Eligible"
          : car["Clean Alternative Fuel Vehicle (CAFV) Eligibility"] ===
            "Not eligible due to low battery range"
          ? "Not Eligible"
          : "Unknown";
      acc[eligibilityKey] = (acc[eligibilityKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(fuelEligibilityData).map(
      ([eligibility, count]) => ({
        eligibility,
        count,
      })
    );

    const totalVehicles = chartData.reduce((acc, car) => car.count + acc, 0);

    return { data: chartData, totalVehicles };
  }, [filteredData]);

  // 5. Fuel Type
  const fuelTypeData = useMemo(() => {
    const typeData = filteredData.reduce((acc, car) => {
      acc[car["Electric Vehicle Type"]] =
        (acc[car["Electric Vehicle Type"]] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeData)
      .map(([type, count]) => ({
        name: type,
        value: count,
      }))
      .slice(0, 2);
  }, [filteredData]);

  // 6. EVs Trend
  const evTrendData = useMemo(() => {
    const yearData = filteredData.reduce((acc, car) => {
      acc[car["Model Year"]] = (acc[car["Model Year"]] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(yearData)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([year, count]) => ({
        year: Number(year),
        models: count,
      }));
  }, [filteredData]);

  useLayoutEffect(() => {
    if (allManufacturers.length) {
      setRangeManufacturer(allManufacturers[0]);
    }
  }, [selectedCounty, allManufacturers]);

  useLayoutEffect(() => {
    if (modelsByManufacturer.length) {
      setRangeModel(modelsByManufacturer[0]);
    }
  }, [rangeManufacturer, modelsByManufacturer]);

  const handleCountyChange = useCallback((newCounty: string) => {
    setSelectedCounty(newCounty);
    setSelectedCity("");
  }, []);

  const handleRangeManufacturerChange = useCallback(
    (newManufacturer: string) => {
      setRangeManufacturer(newManufacturer);
      setRangeModel("");
    },
    []
  );

  const resetFilters = useCallback(() => {
    setSelectedCounty("");
    setSelectedCity("");
  }, []);

  const allChartColors = Object.values(chartColors);

  if (isLoading) return <Title className="p-4">Loading...</Title>;
  if (error)
    return (
      <div className="p-4">An error occurred: {(error as Error).message}</div>
    );

  if (!evData || evData.length === 0)
    return <div className="p-4">Analytics Data is Empty</div>;

  return (
    <div className="p-4 space-y-4">
      <Title>EV Analytics Dashboard</Title>

      {/* Filters Section */}
      <div className="whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
        State: Washington (WA), US
      </div>
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* County Filter */}
        <div>
          <Label htmlFor="county">County</Label>
          <Select value={selectedCounty} onValueChange={handleCountyChange}>
            <SelectTrigger id="county">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {uniqueCounties.map((county) => (
                <SelectItem key={county} value={county}>
                  {county}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City Filter */}
        <div>
          <Label htmlFor="city">City</Label>
          <Select
            value={selectedCity}
            onValueChange={setSelectedCity}
            disabled={!selectedCounty}
          >
            <SelectTrigger id="city">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {uniqueCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="secondary"
          className="w-max h-max self-end"
          onClick={resetFilters}
        >
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top manufacturers */}
        <Card className="flex flex-col items-center p-4">
          <Title className="self-start">Top Manufacturers</Title>
          <DonutChart
            data={topManufacturers.data}
            category="name"
            value="value"
            valueFormatter={(value) =>
              `${value.toLocaleString()} vehicles (${(
                (value / topManufacturers.totalCarsMade) *
                100
              ).toFixed(2)}%)`
            }
            className="mt-8"
          />
          <p className="w-full mt-8 flex items-center justify-between text-tremor-label text-tremor-content dark:text-dark-tremor-content">
            <span>Manufacturer</span>
            <span>Vehicles / share</span>
          </p>
          <List className="mt-2">
            {topManufacturers.data.map((item, index) => (
              <ListItem key={item.name} className="space-x-6">
                <div className="flex items-center space-x-2.5 truncate">
                  <span
                    className={clsx(
                      allChartColors[index].bg,
                      "size-2.5 shrink-0 rounded-sm"
                    )}
                    aria-hidden={true}
                  />
                  <span className="truncate dark:text-dark-tremor-content-emphasis">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium tabular-nums text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    {`${item.value.toLocaleString()}`}
                  </span>
                  <span className="rounded-tremor-small bg-tremor-background-subtle px-1.5 py-0.5 text-tremor-label font-medium tabular-nums text-tremor-content-emphasis dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content-emphasis">
                    {(
                      (item.value / topManufacturers.totalCarsMade) *
                      100
                    ).toFixed(2)}
                  </span>
                </div>
              </ListItem>
            ))}
          </List>
        </Card>

        {/* Top Models */}
        <Card className="flex flex-col p-4">
          <Title>Top Models</Title>
          <BarChart
            data={topModelsData}
            index="model"
            categories={["vehicles"]}
            valueFormatter={(value) => `${value.toLocaleString()}`}
            className="md:h-full"
            yAxisLabel="Vehicles"
            xAxisLabel="Model"
          />
        </Card>

        {/* EV Range */}
        <Card className="flex flex-col p-4">
          <Title>EV Range</Title>

          <div className="my-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Manufacturer Filter */}
            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Select
                value={rangeManufacturer}
                onValueChange={handleRangeManufacturerChange}
              >
                <SelectTrigger id="manufacturer">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {allManufacturers.map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Model Filter */}
            <div>
              <Label htmlFor="model">Model</Label>
              <Select value={rangeModel} onValueChange={setRangeModel}>
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {modelsByManufacturer.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <BarChart
            data={evRangeData}
            index="year"
            categories={["range"]}
            valueFormatter={(value) =>
              `${value > 0 ? `${value.toLocaleString()}` : "Unknown"}`
            }
            className="md:h-full"
            yAxisLabel="Miles"
            xAxisLabel="Year"
          />
        </Card>

        {/* Fuel Eligibility */}
        <Card className="flex flex-col justify-center items-center p-4">
          <Title className="self-start">Fuel Eligibility</Title>
          <DonutChart
            data={fuelEligibilityData.data}
            category="eligibility"
            value="count"
            valueFormatter={(value) =>
              `${value > 0 ? `${value.toLocaleString()} vehicles` : "Unknown"}`
            }
            variant="pie"
          />
          <p className="w-full mt-8 flex items-center justify-between text-tremor-label text-tremor-content dark:text-dark-tremor-content">
            <span>Eligibility</span>
            <span>Vehicles / percent</span>
          </p>
          <List className="mt-2">
            {fuelEligibilityData.data.map((item, index) => (
              <ListItem key={item.eligibility} className="space-x-6">
                <div className="flex items-center space-x-2.5 truncate">
                  <span
                    className={clsx(
                      allChartColors[index].bg,
                      "size-2.5 shrink-0 rounded-sm"
                    )}
                    aria-hidden={true}
                  />
                  <span className="capitalize truncate dark:text-dark-tremor-content-emphasis">
                    {item.eligibility === "Eligible"
                      ? "Clean Alternative Fuel Vehicle Eligible"
                      : item.eligibility === "Not Eligible"
                      ? "Not eligible due to low battery range"
                      : "Eligibility unknown as battery range has not been researched"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium tabular-nums text-tremor-content-strong dark:text-dark-tremor-content-strong">
                    {`${item.count.toLocaleString()}`}
                  </span>
                  <span className="rounded-tremor-small bg-tremor-background-subtle px-1.5 py-0.5 text-tremor-label font-medium tabular-nums text-tremor-content-emphasis dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content-emphasis">
                    {(
                      (item.count / fuelEligibilityData.totalVehicles) *
                      100
                    ).toFixed(2)}
                  </span>
                </div>
              </ListItem>
            ))}
          </List>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Fuel Type */}
        <Card className="flex flex-col gap-2 h-max p-4">
          <Title>Fuel Type</Title>
          <BarList data={fuelTypeData} showAnimation={true} />
        </Card>

        {/* EVs Trend */}
        <Card className="flex flex-col p-4">
          <Title>EVs Trend</Title>
          <AreaChart
            data={evTrendData}
            index="year"
            categories={["models"]}
            xAxisLabel="Year"
            yAxisLabel="Models"
          />
        </Card>
      </div>
    </div>
  );
}
