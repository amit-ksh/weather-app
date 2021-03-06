import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Grid, GridItem, Heading, Spinner } from '@chakra-ui/react';
import axios from 'axios';
import * as dayjs from 'dayjs';

import TodayWeather from './TodayWeather';
import SunriseAndSunsetCard from './SunriseAndSunsetCard';
import AQICard from './AQICard';
import DewPointCard from './DewPointCard';
import DailyWeatherCard from './DailyWeatherCard';
import HourlyWeather from './HourlyWeather';
import LocationInput from './LocationInput';

async function getWeatherData(location, navigate) {
  return axios
    .get(`${process.env.REACT_APP_API_URL}/weather/${location}`)
    .then(({ data }) => data)
    .catch(() => {
      navigate('/error');
    });
}

export default function WeatherDetail({ onLocationChange, navigate }) {
  const [weatherData, setWeatherData] = useState({});
  const [AQIData, setAQIData] = useState({});
  const [location, setLocation] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [todayDate, setTodayDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const now = dayjs();
    // HH:MM: AM/PM
    setCurrentTime(now.format('h:mm A'));
    // DAY, DATE MONTH, YEAR
    setTodayDate(now.format('dddd, D MMMM, YYYY'));
  }, [searchParams]);

  useEffect(() => {
    const location = searchParams.get('location');
    getWeatherData(location, navigate).then(newWeatherData => {
      const newAQIData = getAQIQualitativeName(newWeatherData.aqi);

      setWeatherData({ ...weatherData, ...newWeatherData });
      setLocation(newWeatherData.location);
      setAQIData({ ...AQIData, ...newAQIData });
      setLoading(false);
    });
  }, [searchParams]);

  const getAQIQualitativeName = aqi => {
    const AQIQualitativeName = [
      { name: 'Good', color: '#90ee90' },
      { name: 'Fair', color: 'green' },
      { name: 'Moderate', color: 'yellow' },
      { name: 'Poor', color: 'orange' },
      { name: 'Very Poor', color: 'red' },
    ];

    return { value: aqi, ...AQIQualitativeName[aqi - 1] };
  };

  const getFormattedHourlyData = () => {
    const formattedHourlyData = [{}];
    weatherData.hourly.forEach(({ temp, dt }, index) => {
      if (index < 10) {
        formattedHourlyData.push({
          temperature: temp,
          time: dayjs.unix(dt).format('HH:mm'),
        });
      }
    });
    return formattedHourlyData;
  };

  if (loading) {
    return (
      <Box
        h="100vh"
        w="100vw"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Spinner color="teal.300" size="xl" />
      </Box>
    );
  }

  return (
    <Grid
      as="main"
      bg="whitesmoke"
      templateColumns="repeat(15, 1fr)"
      templateRows="repeat(1, 1fr)"
      p={4}
    >
      <GridItem p={4} rowSpan="2" colSpan={['15', '15', '11']}>
        <Box mb={4}>
          <LocationInput onSubmit={onLocationChange} />
        </Box>
        <Box>
          <Heading as="h5" size="2xl">
            {currentTime}
          </Heading>
          <Heading as="h5" size="md" pb="2">
            {todayDate}
          </Heading>
          <Heading as="h5" size="xl">
            {'Good ' +
              (currentTime.includes('AM') ? 'Morning' : 'Evening') +
              '!'}
          </Heading>
        </Box>
      </GridItem>

      <GridItem rowSpan="7" colSpan={['15', '15', '4']} bg="whitesmoke">
        <TodayWeather current={weatherData.current} location={location} />
      </GridItem>

      <GridItem rowSpan="5" colSpan={['15', '15', '11']}>
        <Grid templateColumns="repeat(6, 1fr)" columnGap={2} rowGap={2} m={4}>
          <GridItem colSpan={[6, 6, 2]} p={4} bg="white" borderRadius={'xl'}>
            <SunriseAndSunsetCard
              sunrise={weatherData.current.sunrise}
              sunset={weatherData.current.sunset}
            />
          </GridItem>

          <GridItem colSpan={[6, 3, 2]} p={4} bg="white" borderRadius={'xl'}>
            <DewPointCard dewPoint={weatherData.current.dew_point} />
          </GridItem>

          <GridItem colSpan={[6, 3, 2]} p={4} bg="white" borderRadius={'xl'}>
            <AQICard
              value={AQIData.value}
              name={AQIData.name}
              color={AQIData.color}
            />
          </GridItem>
        </Grid>

        <Box h={['55vh', '35vh']} w={['85vw', '85vw', '60vw']} m={4} my={0}>
          <Heading as="h6" size="md" p={2}>
            Hourly
          </Heading>
          <HourlyWeather data={getFormattedHourlyData()} />
        </Box>
      </GridItem>

      <GridItem rowSpan="1" colSpan="15" m={4}>
        <Heading as="h6" size="md" p={2}>
          Daily
        </Heading>
        <Grid gridTemplateColumns="repeat(8, 1fr)" columnGap={4} rowGap={4}>
          {weatherData.daily.map((data, idx) => {
            return (
              <GridItem key={idx} colSpan={[4, 2, 1]}>
                <DailyWeatherCard
                  timestamp={data.dt}
                  temperature={data.temp.day}
                  icon={data.weather[0].icon}
                  description={data.weather[0].description}
                />
              </GridItem>
            );
          })}
        </Grid>
      </GridItem>
    </Grid>
  );
}
