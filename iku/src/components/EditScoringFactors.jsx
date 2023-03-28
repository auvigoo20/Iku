import React, {useEffect, useState} from "react";
import axios from "axios";
import mongoose from "mongoose";
import {
  checkIfWeightsAddTo100,
  convertUserFactorWeightsToArr,
  convertUserNightDayWeightsToArr,
  convertUserNightDirectionWeightsToArr,
  convertUserTimeSliceWeightsToArr,
  convertUserWeekendWeightsToArr,
  defaultUserFactorWeights,
  defaultUserNightDayWeights,
  defaultUserNightDirectionWeights,
  defaultUserRoutingPreferences,
  defaultUserScoringPreferences,
  defaultUserTimeSliceWeights,
  defaultUserWeekendWeights
} from "../backend/config/defaultUserPreferences";
import {
  Dialog, DialogTitle
} from "@mui/material";
import {
  ConsistencyImportanceInfo,
  FactorWeightsInfo,
  NightDayWeightsInfo,
  NightDirectionWeightsInfo,
  TimeSliceWeightsInfo,
  AccessibilitySettingsInfo,
  WeekendWeightsInfo,
  WorstAcceptableCasesInfo
} from "./ScoringFactorInfoPopovers";

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IsWheelChair,
  WalkReluctance,
  ConsistencyImportance,
  WorstAcceptableCases,
  CoreFactorWeights,
  NightDayWeights,
  NightDirectionWeights,
  WeekendWeights,
  TimeSliceWeights,
  factorHexColors,
  nightDayHexColors,
  nightDirectionHexColors,
  weekendHexColors,
  timeSliceHexColors
} from "./ScoringFactorFormElements";

const user_id = localStorage.getItem("user_id");

async function updateUserPreferences(data, scoring) {
  const currentDate = Date.now();

  data._id = mongoose.Types.ObjectId(user_id);
  if (scoring) {
    data.lastScoringPrefChangeTime = currentDate;
  } else {
    data.lastRoutingPrefChangeTime = currentDate;
  }

  return await axios
    .post("http://localhost:5000/modifyUserByID", data)
    .catch((error) => {
      console.log(error.message);
    });
}

export default function EditScoringFactors(props) {
  const [factorWeights, setFactorWeights] = useState([]);
  const [nightDayWeights, setNightDayWeights] = useState([]);
  const [nightDirectionWeights, setNightDirectionWeights] = useState([]);
  const [weekendWeights, setWeekendWeights] = useState([]);
  const [timeSliceWeights, setTimeSliceWeights] = useState([]);
  const [consistencyImportance, setConsistencyImportance] = useState([]);
  const [worstAcceptableFrequency, setWorstAcceptableFrequency] = useState([]);
  const [worstAcceptableDuration, setWorstAcceptableDuration] = useState([]);
  const [walkReluctance, setWalkReluctance] = useState([]);
  const [isWheelChair, setIsWheelChair] = useState(false);


  const [infoPopoverActive, setInfoPopoverActive] = useState(false);
  const [infoPopoverName, setInfoPopoverName] = useState(null);
  const [infoPopoverContent, setInfoPopoverContent] = useState(null);

  // Fetch user's preferred scoring priorities
  const fetchUserPreferences = async () => {
    if(user_id === null) {

      if(sessionStorage.getItem("factorWeights") === null) {
        sessionStorage.setItem("factorWeights", JSON.stringify(defaultUserFactorWeights))
      } else {
        let preferences = JSON.parse(sessionStorage.getItem("factorWeights"));
        let userFactorWeights = preferences.factorWeights;

        setFactorWeights([userFactorWeights.frequencyWeight, userFactorWeights.durationWeight]);
      }
    }

    else {
      // Get the weighted average scores
      const response = await axios.get(`http://localhost:5000/userById/${user_id}`);
      const userData = response.data[0];

      const weightsToFetch = [
        // [converterFunction, weightName, stateSetterFunction, defaultWeights]
        [convertUserFactorWeightsToArr, "factorWeights", setFactorWeights, defaultUserFactorWeights],
        [convertUserNightDayWeightsToArr, "nightDayWeights", setNightDayWeights, defaultUserNightDayWeights],
        [convertUserNightDirectionWeightsToArr, "nightDirectionWeights", setNightDirectionWeights, defaultUserNightDirectionWeights],
        [convertUserWeekendWeightsToArr, "weekendWeights", setWeekendWeights, defaultUserWeekendWeights],
        [convertUserTimeSliceWeightsToArr, "timeSliceWeights", setTimeSliceWeights, defaultUserTimeSliceWeights],
      ]

      for (let i of weightsToFetch) {
        const convert = i[0];
        const weightName = i[1];
        const setState = i[2];
        const defaults = i[3];

        let resetWeights = true

        if (userData.hasOwnProperty(weightName)) {
          const fetched = convert(userData[weightName]);

          if (checkIfWeightsAddTo100(fetched)) {
            setState(fetched);
            resetWeights = false;
          }
        }

        if (resetWeights) {
          await updateUserPreferences({[weightName]: defaults}, true);
          setState(convert(defaults));
        }
      }

      const scoringAndRoutingPreferencesToFetch = [
        // [weightName, stateSetterFunction, isScoringPreference]
        ["consistencyImportance", setConsistencyImportance, true],
        ["worstAcceptableFrequency", setWorstAcceptableFrequency, true],
        ["worstAcceptableDuration", setWorstAcceptableDuration, true],
        ["walkReluctance", setWalkReluctance, false],
        ["isWheelChair", setIsWheelChair, false],
      ]

      for (let i of scoringAndRoutingPreferencesToFetch) {
        const weightName = i[0];
        const setState = i[1];
        const isScoringPreference = i[2]

        const defaults = isScoringPreference ? defaultUserScoringPreferences : defaultUserRoutingPreferences;

        if (userData.hasOwnProperty(weightName)) {
          const fetched = userData[weightName];
          setState(fetched);
        } else {
          await updateUserPreferences({[weightName]: defaults[weightName]}, isScoringPreference);
          setState(defaults[weightName]);
        }
      }
    }
  }

  useEffect(() => {
    fetchUserPreferences();
  }, []);

  const [isOpen, setIsOpen] = useState(false);

  // For these weighted values, we need slider values since
  //  the slider stores "cumulative" values, but we need non-cumulative ones
  const [factorSliderVal, setFactorSliderVal] = useState([]);
  const [nightDaySliderVal, setNightDaySliderVal] = useState([]);
  const [nightDirectionSliderVal, setNightDirectionSliderVal] = useState([]);
  const [weekendSliderVal, setWeekendSliderVal] = useState([]);
  const [timeSliceSliderVal, setTimeSliceSliderVal] = useState([]);

  // Store the old values, so we can reset the modal when we close it
  const [oldFactorWeights, setOldFactorWeights] = useState([]);
  const [oldNightDayWeights, setOldNightDayWeights] = useState([]);
  const [oldNightDirectionWeights, setOldNightDirectionWeights] = useState([]);
  const [oldWeekendWeights, setOldWeekendWeights] = useState([]);
  const [oldTimeSliceWeights, setOldTimeSliceWeights] = useState([]);

  const [oldConsistencyImportance, setOldConsistencyImportance] = useState([]);
  const [oldWorstAcceptableFrequency, setOldWorstAcceptableFrequency] = useState([]);
  const [oldWorstAcceptableDuration, setOldWorstAcceptableDuration] = useState([]);
  const [oldWalkReluctance, setOldWalkReluctance] = useState([]);
  const [oldIsWheelChair, setOldIsWheelChair] = useState([]);

  function createCumulativeArray(val) {
    let newArr = [val[0]];
    for (let i=1; i<val.length-1; i++) {
      newArr.push(val[i]+newArr[i-1]);
    }
    return newArr;
  }

  function openModal() {
    // Save old values in case user clicks cancel
    // TODO: there's probably a better way to do this.
    setOldFactorWeights(factorWeights);
    setOldNightDayWeights(nightDayWeights);
    setOldNightDirectionWeights(nightDirectionWeights);
    setOldWeekendWeights(weekendWeights);
    setOldTimeSliceWeights(timeSliceWeights);

    setOldConsistencyImportance(consistencyImportance);
    setOldWorstAcceptableFrequency(worstAcceptableFrequency);
    setOldWorstAcceptableDuration(worstAcceptableDuration);
    setOldWalkReluctance(walkReluctance);
    setOldIsWheelChair(isWheelChair);

    // Save the slider values too, for the ones that represent weights
    setFactorSliderVal(createCumulativeArray(factorWeights));
    setNightDaySliderVal(createCumulativeArray(nightDayWeights));
    setNightDirectionSliderVal(createCumulativeArray(nightDirectionWeights));
    setWeekendSliderVal(createCumulativeArray(weekendWeights));
    setTimeSliceSliderVal(createCumulativeArray(timeSliceWeights));

    setIsOpen(true);
  }


  function closeModal() {
    // Reset to old values
    setFactorWeights(oldFactorWeights);
    setNightDayWeights(oldNightDayWeights);
    setNightDirectionWeights(oldNightDirectionWeights);
    setWeekendWeights(oldWeekendWeights);
    setTimeSliceWeights(oldTimeSliceWeights);

    setConsistencyImportance(oldConsistencyImportance);
    setWorstAcceptableFrequency(oldWorstAcceptableFrequency);
    setWorstAcceptableDuration(oldWorstAcceptableDuration);
    setWalkReluctance(oldWalkReluctance);
    setIsWheelChair(oldIsWheelChair);

    // Reset slider values for the ones that represent weights
    setFactorSliderVal(createCumulativeArray(oldFactorWeights));
    setNightDaySliderVal(createCumulativeArray(oldNightDayWeights));
    setNightDirectionSliderVal(createCumulativeArray(oldNightDirectionWeights));
    setWeekendSliderVal(createCumulativeArray(oldWeekendWeights));
    setTimeSliceSliderVal(createCumulativeArray(oldTimeSliceWeights));

    // Close modal without saving changes
    setIsOpen(false);
  }

  // Submit user's scoring factor preferences
  const submitHandler = async (event) => {
    event.preventDefault();

    if(user_id === null) {
      let preferences = JSON.parse(sessionStorage.getItem("preferences"));

      // TODO: Save ALL data
      preferences.factorWeights = factorWeights;

      sessionStorage.setItem("preferences", JSON.stringify(preferences));
    } else {
      const data = {
        factorWeights: {
          frequencyWeight: factorWeights[0],
          durationWeight: factorWeights[1]
        }
      };
      await updateUserPreferences(data);
    }
    window.location.reload(false);
  };

  const handleCloseInfoPopover = () => {
    setInfoPopoverActive(false);
    setInfoPopoverName('')
  }

  const handleOpenInfoPopover = (newSetting) => {

    let markToCollapse = false;

    switch(newSetting) {
      case "accessibilitySettingsInfo":
        setInfoPopoverContent(<AccessibilitySettingsInfo handleClose={handleCloseInfoPopover} />);
        break;
      case "consistencyImportanceInfo":
        setInfoPopoverContent(<ConsistencyImportanceInfo handleClose={handleCloseInfoPopover} />);
        break;
      case "worstAcceptableCasesInfo":
        setInfoPopoverContent(<WorstAcceptableCasesInfo handleClose={handleCloseInfoPopover} />);
        break;
      case "factorInfo":
        setInfoPopoverContent(<FactorWeightsInfo handleClose={handleCloseInfoPopover} colors={factorHexColors} />);
        break;
      case "nightDayInfo":
        setInfoPopoverContent(<NightDayWeightsInfo handleClose={handleCloseInfoPopover} colors={nightDayHexColors} />);
        break;
      case "nightDirectionInfo":
        setInfoPopoverContent(<NightDirectionWeightsInfo handleClose={handleCloseInfoPopover} colors={nightDirectionHexColors} />);
        break;
      case "weekendInfo":
        setInfoPopoverContent(<WeekendWeightsInfo handleClose={handleCloseInfoPopover} colors={weekendHexColors} />);
        break;
      case "timeSliceInfo":
        setInfoPopoverContent(<TimeSliceWeightsInfo handleClose={handleCloseInfoPopover} colors={timeSliceHexColors} />);
        break;
      default:
        setInfoPopoverContent(null);
        setInfoPopoverName('');
        markToCollapse = true;
        break;
    }

    if (markToCollapse || newSetting === infoPopoverName) {
      handleCloseInfoPopover();
    } else {
      setInfoPopoverActive(true);
      setInfoPopoverName(newSetting);
    }
  }


  return (
    <>
      <div>
        <button onClick={openModal} type="button" className={props.buttonClass}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
               stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
          </svg>
          Edit Scoring Factors
        </button>
      </div>

      <Dialog open={isOpen} onClose={closeModal}
              sx={{
                '& .MuiBackdrop-root': {
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  backdropFilter: 'blur(8px)'
                }
              }}
      >
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div
              className="w-full absolute top-4 max-w-md z-10 transition-transform duration-300 overflow-hidden rounded-2xl bg-gradient-to-br from-white to-emerald-50 dark:from-emerald-900 dark:to-emerald-dark p-6 text-left align-middle shadow-xl"
              style={infoPopoverActive ? {
                transform: 'translate(calc(-50% - 0.5rem))'
              } : {
                transform: 'translate(0)'
              }}>
              <div className="flex justify-between gap-2 pb-1">
                <DialogTitle
                  as="h3"
                  className="text-3xl font-semibold leading-snug text-transparent bg-clip-text bg-gradient-to-r from-emerald-900 to-emerald-dark dark:from-white dark:to-emerald-100 flex items-center"
                  sx={{ p: 0 }}
                >
                  Edit scoring factors
                </DialogTitle>
              </div>

              <hr className="mb-8 dark:border-emerald-700"></hr>

              <div>
                <Accordion className="rounded-t-xl">
                  <AccordionSummary showHelp={() => {handleOpenInfoPopover("accessibilitySettingsInfo")}}>
                    <span>Accessibility Settings</span>
                  </AccordionSummary>
                  <AccordionDetails>
                    <div className="flex flex-col gap-4">
                      <WalkReluctance state={[walkReluctance, setWalkReluctance]}/>
                      <IsWheelChair state={[isWheelChair, setIsWheelChair]}/>
                    </div>
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary showHelp={() => {handleOpenInfoPopover("consistencyImportanceInfo")}}>
                    <span>Consistency Importance</span>
                  </AccordionSummary>
                  <AccordionDetails>
                    <ConsistencyImportance state={[consistencyImportance, setConsistencyImportance]}/>
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary showHelp={() => {handleOpenInfoPopover("worstAcceptableCasesInfo")}}>
                    <span>Worst Acceptable Cases</span>
                  </AccordionSummary>
                  <AccordionDetails>
                    <WorstAcceptableCases
                      freqState={[worstAcceptableFrequency, setWorstAcceptableFrequency]}
                      durState={[worstAcceptableDuration, setWorstAcceptableDuration]}
                    />
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary showHelp={() => {handleOpenInfoPopover("factorInfo")}}>
                    <span>Core Scoring Factor Weights</span>
                  </AccordionSummary>
                  <AccordionDetails>
                    <CoreFactorWeights
                      valueState={[factorWeights, setFactorWeights]}
                      sliderState={[factorSliderVal, setFactorSliderVal]}
                    />
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary showHelp={() => {handleOpenInfoPopover("nightDayInfo")}}>
                    <span>Night Day Weights</span>
                  </AccordionSummary>
                  <AccordionDetails>
                    <NightDayWeights
                      valueState={[nightDayWeights, setNightDayWeights]}
                      sliderState={[nightDaySliderVal, setNightDaySliderVal]}
                    />
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary showHelp={() => {handleOpenInfoPopover("nightDirectionInfo")}}>
                    <span>Night Direction Weights</span>
                  </AccordionSummary>
                  <AccordionDetails>
                    <NightDirectionWeights
                      valueState={[nightDirectionWeights, setNightDirectionWeights]}
                      sliderState={[nightDaySliderVal, setNightDirectionSliderVal]}
                    />
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary showHelp={() => {handleOpenInfoPopover("weekendInfo")}}>
                    <span>Weekend Day Weights</span>
                  </AccordionSummary>
                  <AccordionDetails>
                    <WeekendWeights
                      valueState={[weekendWeights, setWeekendWeights]}
                      sliderState={[weekendSliderVal, setWeekendSliderVal]}
                    />
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary showHelp={() => {handleOpenInfoPopover("timeSliceInfo")}}>
                    <span>Time Period Weights</span>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TimeSliceWeights
                      valueState={[timeSliceWeights, setTimeSliceWeights]}
                      sliderState={[timeSliceSliderVal, setTimeSliceSliderVal]}
                    />
                  </AccordionDetails>
                </Accordion>
              </div>


              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={submitHandler}
                  className="px-4 py-2 flex items-center gap-2 justify-center transition ease-in-out duration-200 text-white bg-emerald-500 hover:bg-emerald-700 focus:ring-4 focus:outline-none focus:ring-green-300 font-semibold rounded-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                       stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Save
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 flex items-center gap-2 justify-center transition ease-in-out duration-200 text-white bg-red-500 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-semibold rounded-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                       stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Cancel
                </button>
              </div>
            </div>
            <div
              className="w-full max-w-md fixed z-0 top-4 transition-transform duration-300 overflow-hidden rounded-2xl bg-gradient-to-br from-white to-emerald-50 dark:from-emerald-900 dark:to-emerald-dark p-6 text-left align-middle shadow-xl"
              style={infoPopoverActive ? {
                transform: 'translate(calc(50% + 0.5rem))'
              } : {
                transform: 'translate(0)'
              }}
            >
              { infoPopoverContent }
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
