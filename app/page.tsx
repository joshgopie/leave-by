"use client";

import { useRef, useState } from "react";

import CurrentLocationCard from "@/components/CurrentLocationCard";
import DestinationCard from "@/components/DestinationCard";
import ArrivalTimeCard from "@/components/ArrivalTimeCard";
import CalculateButton from "@/components/CalculateButton";
import ResultCard from "@/components/ResultCard";
import Header from "@/components/Header";

import type { PlaceSuggestion } from "@/types/places";

import { useLocation } from "@/lib/useLocation";

export default function Home() {

  const [destination, setDestination] =
    useState<PlaceSuggestion | null>(null);


  const [arrivalTime, setArrivalTime] =
    useState("");


  const [leaveTime, setLeaveTime] =
    useState("");


  const [routeInfo, setRouteInfo] = useState({

    travelMinutes: 0,

    distanceKm: 0,

    trafficDelay: 0,

  });


  const resultRef =
    useRef<HTMLDivElement | null>(null);



  const {
    location,
    loading,
    error,
  } = useLocation();




  async function calculateLeaveTime() {


    if (!location || !destination || !arrivalTime) {
      return;
    }



    const response =
      await fetch("/api/routes", {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },


        body: JSON.stringify({

          origin: {

            latitude:
              location.latitude,

            longitude:
              location.longitude,

          },


          destinationPlaceId:
            destination.placeId,

        }),

      });




    const data =
      await response.json();



    console.log("Route:", data);



    if (!data.duration || !data.staticDuration) {

      console.error(
        "Invalid route response"
      );

      return;

    }





    const trafficSeconds =
      Number(
        data.duration.replace("s", "")
      );


    const normalSeconds =
      Number(
        data.staticDuration.replace("s", "")
      );



    const trafficMinutes =
      Math.ceil(
        trafficSeconds / 60
      );


    const normalMinutes =
      Math.ceil(
        normalSeconds / 60
      );



    const trafficDelay =
      trafficMinutes - normalMinutes;




    const totalMinutes =
      trafficMinutes + 10;



    const [hours, minutes] =
      arrivalTime.split(":");



    const arrival =
      new Date();



    arrival.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );



    const leave =
      new Date(
        arrival.getTime()
        -
        totalMinutes * 60000
      );



    const formattedLeave =
      leave.toLocaleTimeString([], {

        hour: "numeric",

        minute: "2-digit",

      });




    setLeaveTime(
      formattedLeave
    );



    setRouteInfo({

      travelMinutes:
        trafficMinutes,


      distanceKm:
        Number(
          (
            data.distanceMeters / 1000
          ).toFixed(1)
        ),


      trafficDelay,

    });




    setTimeout(() => {

      resultRef.current?.scrollIntoView({

        behavior: "smooth",

        block: "center",

      });

    }, 100);

  }





  return (

    <main className="min-h-screen bg-black text-white">

      <div className="mx-auto max-w-xl space-y-4 p-6">

        <Header></Header>


        <CurrentLocationCard

          location={location}

          loading={loading}

          error={error}

        />



        <DestinationCard

          onSelect={(place) => {

            setDestination(place);

          }}

        />



        <ArrivalTimeCard

          value={arrivalTime}

          onChange={setArrivalTime}

        />



        <CalculateButton

          onClick={calculateLeaveTime}

        />




        {leaveTime && (

          <div ref={resultRef}>

            <ResultCard

              leaveTime={leaveTime}

              location={location}

              destination={destination}

              arrivalTime={arrivalTime}

              routeInfo={routeInfo}

            />

          </div>

        )}



      </div>

    </main>

  );

}