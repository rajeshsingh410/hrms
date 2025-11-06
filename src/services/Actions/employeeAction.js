import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { persistor } from '../../store';

const BASE_URL = 'http://10.0.2.2:80/HRMS/controller';
// const BASE_URL = 'https://chaaruvi.com/hrms/Mobileapp/';

/** LoginUserAsync - authenticate user with username/password */
export const LoginUserAsync = (input) => {
  // console.log("action", input);

  return async (dispatch) => {
    try {
      const res = await axios.post(`${BASE_URL}/emp_login.php`, input, {
        headers: { "Content-Type": "application/json" },
      });
      const response = res.data;
      console.log("Login Responce", response);

      let msg = "";
      if (response.status === "200") msg = "Login Successful";
      else if (response.status === "401") msg = "Incorrect Password";
      else if (response.status === "403") msg = "User Not Found";
      else if (response.status === "405") msg = "Missing Fields";
      else msg = "Unknown Error";

      const payload = {
        status: response.status,
        message: msg,
        employee: response.employee || null
      };

      if (response.status === "200") {
        dispatch({ type: "LOGIN_SUCC", payload });
      } else {
        dispatch({ type: "LOGIN_FAILED", payload });
      }

      return payload;
    } catch (error) {
      console.log("Network Error:", error.message);
      const payload = {
        status: "500",
        message: "Server Error or Network Failure"
      };
      dispatch({ type: "LOGIN_FAILED", payload });
      return payload;
    }
  };
};

/** requestOtpAsync - request OTP sent via WhatsApp */
export const requestOtpAsync = (phone) => {
  return async (dispatch) => {
    try {
      const res = await axios.post(`${BASE_URL}/otp_generate.php`, phone, {
        headers: { "Content-Type": "application/json" }
      });
      const r = res.data;

      let msg = '';
      if (r.status === "200") msg = "OTP sent to your WhatsApp";
      else if (r.status === "401") msg = "Input is required";
      else if (r.status === "403") msg = "Mobile number not registered";
      else msg = "Unknown Error";

      const payload = { status: r.status, message: msg };

      if (r.status === "200") dispatch({ type: "OTP_GEN_SUCC", payload });
      else dispatch({ type: "OTP_FAILED", payload });

      return payload;
    } catch (error) {
      console.log("OTP Request Failed:", error);
      throw error;
    }
  };
};

/** loginUserWithOtp - authenticate user using OTP */
export const loginUserWithOtp = (data) => {
  return async (dispatch) => {
    try {
      const res = await axios.post(`${BASE_URL}/otp_verify.php`, data, {
        headers: { "Content-Type": "application/json" }
      });
      const r = res.data;

      if (r.status === "200") dispatch({ type: 'LOGIN_OTP_SUCC', payload: { employee: r } });
      else dispatch({ type: 'OTP_FAILED', payload: { status: r.status } });

      let msg = '';
      if (r.status === "200") msg = "Login Successful";
      else if (r.status === "401") msg = "Login OTP is Invalid";
      else if (r.status === "403") msg = "Login OTP is Expired, please try again";
      else if (r.status === "404") msg = "Login Mobile Number or OTP is missing";
      else msg = "Unknown Error";

      return { status: r.status, message: msg };
    } catch (error) {
      console.log("error :- ", error);
      throw error;
    }
  };
};

/** logoutUser - remove session data and navigate to Login */
export const logoutUser = (navigation) => {
  return async (dispatch) => {
    await AsyncStorage.removeItem('persist:root');
    dispatch({ type: 'LOGOUT_SUCCESS' });
    navigation.replace('Login');
  };
};

export const ATTENDANCE_SUCCESS = "ATTENDANCE_SUCCESS";
export const ATTENDANCE_ERROR = "ATTENDANCE_ERROR";

/** attendanceDataAsunc - submit attendance (check-in or check-out) with selfie */
export const attendanceDataAsunc = (formData) => {
  console.log("formdata", formData);

  return async (dispatch) => {
    try {
      const res = await axios.post(`${BASE_URL}/emp_attendance.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const r = res.data;
      console.log("attendance rec", r);

      const payload = {
        status: r.status,
        message: r.message,
        active: r.active,
        intime: r.intime,
        outtime: r.outtime,
        selfi: r.selfi
      };
      console.log("payload rec", payload);

      // if (r.status === "200" || r.status === "201") dispatch({ type: ATTENDANCE_SUCCESS, payload });
      // else dispatch({ type: ATTENDANCE_ERROR, payload });

      return payload;
    } catch (err) {

      const errorMsg = err.message || "Network error";
      console.log("errror : 500", err);
      console.log("URL", `${BASE_URL}/emp_attendance.php`);
      dispatch({ type: ATTENDANCE_ERROR, payload: { status: "500", message: errorMsg } });
      throw errorMsg;
    }
  };
};

/** getInfoAsync - get today's attendance record for employee */
export const getInfoAsync = (info) => {
  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/att_record.php?empid=${info.empid}&time=${info.date}`);
      const response = res.data;
      console.log("responce", response);
      return response;
    } catch (error) {
      console.log("responce", error);
      throw error;
    }
  };
};

/** getAttHistoryAsync - get historical attendance data for employee */
export const getAttHistoryAsync = (empid) => {
  console.log("empid", empid);

  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/att_history.php?empid=${empid}`);
      const response = res.data;
      console.log("responce histry: ", response);
      return response;
    } catch (error) {
      console.log("error ", error);
      throw error;
    }
  };
};

export const getSubOrdinateAtt = (empid) => {
  console.log("action s empid", empid);

  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/sub_ordinates.php`, { params: { action: "getAttReport", empid: empid } })
      console.log("responce sub ordinate ", res);
      return res.data
    } catch (error) {
      throw error
    }
  }
}

export const handlegetattReport = (payload) => {

  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/regularisation.php`, {
        params: payload,
        headers: { "Content-Type": "application/json" }
      });
      console.log("responce handlegetattReport ", res);
      return res.data
    } catch (error) {
      console.log("error ", error);

    }
  }
}

// apply request for regularigation 

export const sendRegularisation = (payload) => {
  return async (dispatch) => {
    try {
      const res = await axios.post(`${BASE_URL}/regularisation.php`, payload, { headers: { "Content-Type": "application/json" } })
      console.log("apply regularigation", res);
      return res.data
    } catch (error) {
      throw error
    }
  }
}

//** postWallAsync - submit a post to the wall */
export const postWallAsync = (formData) => {
  console.log("formdata", formData);

  return async (dispatch) => {
    try {
      const res = await axios.post(`${BASE_URL}/content_wall.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const response = res.data;
      console.log("after post ", response);

      if (response.status === "200") {
        return response
      } else {
      }

      return response;
    } catch (error) {
      console.log("Post Wall Error:", error);
      throw error;
    }
  };
}

/** getWallPostsAsync - fetch all posts from the wall */
export const getWallPostsAsync = () => {
  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/get_all_posts.php`);
      const response = res.data;
      console.log("response post", response);
      if (response.status === "200") {
        return response.posts;
      } else {
        return [];
      }
    } catch (error) {
      console.log("Get Wall Posts Error:", error);
      throw error;
    }
  };
}

export const interactWithPostAsync = (contentId, userId, type, comment = '', commentId = null) => {
  console.log("Sending:", contentId, userId, type, comment, commentId);

  return async () => {
    try {
      const payload = {
        content_id: contentId,
        user_id: userId,
        type,
        comment
      };

      if (type === "update_comment") {
        payload.comment_id = commentId;
      }

      const res = await axios.post(`${BASE_URL}/content_interactions.php`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log("API Response:", res.data);
      return res.data;
    } catch (error) {
      console.log("Post Interaction Error:", error.message);
      if (error.response) {
        console.log("Server Error:", error.response.data);
      }
      throw error;
    }
  };
};

export const getPostsLikeInfo = (id) => {
  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/content_interactions.php`, {
        params: { id: id },
        headers: { "Content-Type": "application/json" }
      });
      console.log("response for like ", res.data);
      return res.data
    } catch (error) {
      console.log("error ", error);
    }
  }
}

// delete the post 

export const handlePostDeleteAsync = (post_id) => {
  return async (dispatch) => {
    try {
      const res = await axios.post(`${BASE_URL}/get_all_posts.php`, {
        post_id: post_id
      })
      console.log("responce for delete post", res.data);
      return res.data
    } catch (error) {
      console.log("error delete post", error);
      throw error
    }
  }
}

// delete posts comments 
export const deleteCommentAsync = (commentId) => {
  console.log("commentId action", commentId);

  return async (dispatch) => {
    try {
      const payload = {
        comment_id: commentId,
        type: "Delete_comment"
      }
      const res = await axios.post(`${BASE_URL}/content_interactions.php`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      return res.data; // { status: 'comment_deleted' }
    } catch (err) {
      console.error('Delete comment error:', err);
      throw err;
    }
  };
}

// leave Section get leave.php all are apis avilable there related leave so you can find by using action

export const getLeaveAsync = () => {
  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/get_leave.php`, { params: { action: 'getLeave' } })
      console.log("get leave types", res);

      const responce = res.data;
      return responce
    } catch (error) {
      throw error
    }
  }
}

export const getChackLeaveAvility = (payload) => {
  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/get_leave.php`, { params: { action: 'checkLeave', leaveType: payload.leaveType, empid: payload.empid } })
      return res.data
    } catch (error) {
      throw error
    }
  }
}

export const LeaveRequestAsync = (payload) => {
  console.log("leave req data ", payload);

  return async (dispatch) => {
    try {
      const formData = new FormData();
      formData.append("action", "Request_Leave");
      formData.append("empid", payload.empid);
      formData.append("leaveType", payload.leaveType);
      formData.append("reason", payload.reason);
      formData.append("fromDate", payload.fromDate);
      formData.append("toDate", payload.toDate);
      formData.append("days", payload.days);
      formData.append("selectedDates", JSON.stringify(payload.selectedDates));
      formData.append("selectedContacts", JSON.stringify(payload.selectedContacts));

      // ✅ File only if attachment exists
      if (payload.attachment) {
        formData.append("fileName", {
          uri: Platform.OS === "android"
            ? payload.attachment.uri
            : payload.attachment.uri.replace("file://", ""),
          type: payload.attachment.type,
          name: payload.attachment.name,
        });
      }

      const res = await axios.post(`${BASE_URL}/get_leave.php`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
      });

      console.log("res reqLeave", res.data);
      return res.data;
    } catch (error) {
      console.log("error reqLeave", error);
      throw error;
    }
  };
};


//forleave List components 

export const getApplyLeaveStatus = (empid) => {
  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/get_leave.php`, { params: { action: "Appled Leave", id: empid } })
      console.log("responce leave data ", res);
      return res.data
    } catch (error) {
      throw error
    }
  }
}

export const getApplyedSubordinate = (empid) => {
  // console.log("sub ordinate empid", empid);
  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/get_leave.php`, { params: { action: "Appled_subordinate_Leave", id: empid } })
      console.log("responce sub ordinates leave", res.data);
      return res.data
    } catch (error) {
      throw error
    }
  }
}

export const searchLeaves = (filterData) => {
  console.log("filterData", filterData);

  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/get_leave.php`, { params: { action: "Leave_filter", data: filterData } })
      console.log("res search ", res);
      return res.data
    } catch (error) {
      throw error
    }
  }
}

export const deleteLeaveRec = (id) => {
  return async (dispatch) => {
    try {
      const formData = new FormData();
      formData.append("action", "Delete_Leave");
      formData.append("id", id);

      const res = await axios.post(`${BASE_URL}/get_leave.php`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      console.log("response delete leave", res.data);
      return res.data;
    } catch (error) {
      console.log("delete leave error", error);
      throw error;
    }
  };
};

//Assets Screen 

export const getAssets = () => {
  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/get_assets_report.php`, { params: { action: 'assetsmaster', } })
      console.log("Assert data", res);
      return res.data
    } catch (error) {
      console.log(error);
      throw error
    }
  }
}

export const getAssetsReport = (filterdata) => {
  console.log("filterdata", filterdata);
  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/get_assets_report.php`, { params: { action: 'assetsreport', filterdata: filterdata } })
      console.log("Assert data report ", res);
      return res.data
    } catch (error) {
      console.log(error);
      throw error
    }
  }
}

//Get Pass
export const GatepassData = (save) => {
  console.log("filterdata", save);
  return async (dispatch) => {
    try {
      const res = await axios.post(`${BASE_URL}/gatepass.php`, {
        action: "gatepassdata",
        filterdata: save,   // 👈 directly send filterdata
      });
      console.log("Gatepass data  ", res.data);
      return res.data;
    } catch (error) {
      console.log("Gatepass error", error);
      throw error;
    }
  };
};


export const GateReport = (empid) => {
  console.log("empid", empid);
  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/gatepass.php`, {
        params: {
          action: "getreport",
          empid: empid,
        }
      });
      console.log("Gatepass data report ", res.data);
      return res.data;
    } catch (error) {
      console.log("Gatepass error", error);
      throw error;
    }
  };
};

export const UpdateGateReport = (deletedata) => {
  return async (dispatch) => {
    try {
      const res = await axios.post(`${BASE_URL}/gatepass.php`, {
        action: "deleteupdaterecord",
        deletedata: deletedata,
      }, {
        headers: { "Content-Type": "application/json" }
      });
      console.log("deleteupdaterecord ", res.data);
      return res.data;
    } catch (error) {
      console.log("Gatepass error", error);
      throw error;
    }
  };
};

//About Section Api

export const getMyAbout = (empid) => {
  console.log('empid get about me', empid);

  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/my_profile.php?empid=${empid}`);
      // dispatch({ type: "GET_My_ABOUT", payload: res.data })
      console.log("res", res.data);

      return res.data
    } catch (error) {
      console.log("error about api", error);

    }

  }
}


// update Employees data 

export const updateEmployeeSection = (empid, updatedata) => {
  console.log('update data 1', empid, updatedata);

  return async (dispatch) => {
    try {

      const res = await axios.post(`${BASE_URL}/my_profile.php`, { action: "UpdateEmployee", empid: empid, updatedata: updatedata, }, { headers: { 'Content-Type': 'application/json' } });
      console.log("update employees response ", res.data);
      return res.data;
    } catch (error) {
      console.log("Error", error);
      return { success: false, message: "Server error" };
    }
  };
};

// profile image upload 

export const profileImageUpload = (empid, file) => {

  return async (dispatch) => {
    try {
      file.append("action", "profile_img_upload");
      file.append("empid", empid);

      const res = await axios.post(`${BASE_URL}/my_profile.php`, file, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("res profile image upload", res.data);
      return res.data
    } catch (error) {
      console.log("error afetr the image upload", error);

    }
  }
}

// Notices section 
export const getNoticeData = (empid) => {
  console.log("getNoticeData", empid);
  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/notices.php`, { params: { action: "get_notice", empid: empid } })
      console.log("res notice", res);
      return res.data
    } catch (error) {

    }
  }
}

// about_me screen -> fainance section 

export const getMyPay = (empid) => {
  console.log("getMyPay", empid);
  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/myabout.php`, { params: { action: "get_My_pay", empid: empid } })
      console.log("res getMyPay", res);

    } catch (error) {
      console.log("Error ", error);
      throw error

    }
  }
}

export const getMyPaySlip = (empid) => {
  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/myabout.php`, { params: { action: "get_My_payslip", empid: empid } })
      console.log("res getMyPaySlip", res);
      return res.data
    } catch (error) {
      console.log("Error ", error);
      throw error
    }
  }
}

export const getExpenses = (empid) => {
  console.log("getExpenses", empid);
  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/myabout.php`, { params: { action: "my_Expenses", empid: empid } })
      console.log("res getExpenses", res);
      return res.data
    } catch (error) {
      console.log("Error ", error);
      throw error

    }
  }
}

export const getExpansesHeader = () => {
  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/myabout.php`, { params: { action: "get_Expenses_header" } })
      console.log("res getExpenses header", res);
      return res.data
    } catch (error) {
      console.log("Error ", error);
      throw error

    }
  }
}

// Add and update the expensess report
export const addExpanseAction = (formdata) => {
  console.log("filterdata", formdata);
  return async (dispatch) => {
    try {
      const res = await axios.post(`${BASE_URL}/myabout.php`, formdata, { headers: { "Content-Type": "multipart/form-data" } })
      console.log("Assert data report ", res);
      return res.data
    } catch (error) {
      console.log(error);
      throw error
    }
  }
}

//get recently added expensess report 

export const getExpansesData = (empid) => {
  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/myabout.php`, { params: { action: "get_Added_Expenses", empid: empid } })
      console.log("Assert data report ", res);
      return res.data
    } catch (error) {
      console.log(error);

    }
  }
}

//fainally apply the expance report 

export const ApplyFainalExpance = (formdata) => {
  console.log("filterdata", formdata);

  return async (dispatch) => {
    try {
      const res = await axios.post(`${BASE_URL}/myabout.php`, formdata, { headers: { "Content-Type": "multipart/form-data" } })
      console.log("Assert data report ", res);
      return res.data
    }
    catch (error) {
      console.log("Error=>>>>>.", error);

      throw error
    }
  }
}

// delete the expance report
export const deleteExpanceAction = (payload) => {
  return async (dispatch) => {
    try {
      const res = await axios.post(`${BASE_URL}/myabout.php`, payload, { headers: { "Content-Type": "multipart/form-data" } });
      console.log("delete expance", res.data);
      return res.data
    } catch (error) {
      console.log("Error=>>>>>.", error);

    }
  }
}

//outside actiovity actions 

export const outsideactivity = (save) => {
  console.log('outsideactivity task', save);
  return async (dispatch) => {
    try {
      const res = await axios.post(`${BASE_URL}/outsideactivity.php`, {
        action: "outsideactivity",
        savedata: save,
      }, {
        headers: { "Content-Type": "application/json" }
      });
      console.log("outsideactivity ", res.data);
      return res.data;
    } catch (error) {
      console.log("outsideactivity error", error);
      throw error;
    }
  };
};

export const trackLocation = (payload) => {
  console.log('trackLocation', payload);
  return async (dispatch) => {

  }
}

export const getoutsideactivity = (empid) => {
  // console.log('getoutsideactivity', empid);
  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/outsideactivity.php`, {
        params: {
          action: "getoutsideactivity",
          empid: empid,
        },
        headers: { "Content-Type": "application/json" }
      });
      console.log("getoutsideactivity ", res.data);
      return res.data;
    } catch (error) {
      console.log("getoutsideactivity error", error);
      throw error;
    }
  };
};

export const Assignby = (empid) => {
  console.log('Assignby', empid);
  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/outsideactivity.php`, {
        params: {
          action: "Assignby",
          empid: empid,
        },
        headers: { "Content-Type": "application/json" }
      });
      console.log("Assignby ", res.data);
      return res.data;
    } catch (error) {
      console.log("Assignby error", error);
      throw error;
    }
  };
};

export const CreateActivity = (save) => {
  console.log("createactivity data", save);
  return async (dispatch) => {
    try {
      const res = await axios.post(`${BASE_URL}/outsideactivity.php`, {
        action: "createActivity",
        activitydata: save,   // 👈 directly send filterdata
      });
      console.log("CreateActivity data  ", res.data);
      return res.data;
    } catch (error) {
      console.log("CreateActivity error", error);
      throw error;
    }
  };
};

//holiday List actions

export const getholidaylist = (empid) => {
  // console.log('Assignby', empid);
  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/holiday_list.php`, {
        params: {
          action: "holidaylist",
          empid: empid,
        },
        headers: { "Content-Type": "application/json" }
      });
      console.log("holidaylist ", res.data);
      return res.data;
    } catch (error) {
      console.log("holidaylist error", error);
      throw error;
    }
  };
};

// Task ManangeMent 

export const AssignTaskAsync = (formData) => {
  // console.log("Form data ", formData);

  return async (dispatch) => {
    try {
      const res = await axios.post(`${BASE_URL}/tasks.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log("Task Created Response:", res.data);
      // ✅ You can dispatch any success action here if needed
      return res.data
    } catch (error) {
      console.log("Error with Create Task:", error);
    }
  };
};


export const getTaskasync = (empid) => {

  return async (dispatch) => {
    try {
      const res = await axios.get(`${BASE_URL}/tasks.php`, {
        params: {
          action: "get_all_task",
          empid: empid,
        },
        headers: { "Content-Type": "application/json" }
      });
      console.log("responce get task", res.data);
      return res.data
    } catch (error) {
      console.log("error with get task list on action page", error);
    }
  }
}

// get task history 
export const getMyTaskHistory = (id, empid) => {
  console.log(" get task history ",id, empid);
  
  return async (dispatch) => {
    try {
      // Start with mandatory params
      const params = { action: "get_Task_history", id };

      // Conditionally add empid if it exists
      if (empid) {
        params.empid = empid;
      }

      const res = await axios.get(`${BASE_URL}/tasks.php`, {
        params,
        headers: { "Content-Type": "application/json" },
      });

      console.log("Task history response:", res.data);
      return res.data;
    } catch (error) {
      console.log("Error fetching task history:", error);
    }
  };
};

//daily update task  

export const updateDailyTask = (formData) => {
  return async (dispatch) => {
    try {
       const res = await axios.post(`${BASE_URL}/tasks.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log("response daily task update", res.data);
    
    } catch (error) {
      console.log("error", error);

    }
  }
}