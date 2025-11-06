// employeeReducer.js
const initialState = {
  employee: null,
  message: null,
  attResponse: null,
  status: null,
  att_info : [],
  getEmpInfo : null
};

const employeeReducer = (state = initialState, action) => {
  switch (action.type) {
    case "LOGIN_SUCC":
      return {
        ...state,
        employee: action.payload.employee,
        message: action.payload.message,
        status: "200",
      };

    case "LOGIN_FAILED":
      return {
        ...state,
        employee: null,
        message: action.payload.message,
        status: action.payload.status || "400",
      };

    case "LOGIN_OTP_SUCC":
 
      return {
        ...state,
        employee: action.payload.employee.employee,
        message: action.payload.message,
        status: "200",
      };

    case "OTP_FAILED":
      return {
        ...state,
        message: action.payload.message,
        status: action.payload.status,
      };

    case "OTP_GEN_SUCC":
      return {
        ...state,
        message: action.payload.message,
        status: action.payload.status.status,
      };
    case "ERROR":
      return {
        ...state,
        message: action.payload.message,
        status: action.payload.status.status,
      };

    case "LOGOUT_SUCCESS":
      return {
        ...state,
        employee: null,
        message: null,
        status: null,
        // attResponse: null,
      };

    case "ATTENDANCE_SUCCESS":
      return { ...state, attResponse: action.payload };
    case "ATTENDANCE_ERROR":
      return { ...state, attResponse: action.payload };

    case 'GET_ATT_INFO' :
      return{
        ...state,
        att_info : action.payload
      }

    case 'GET_My_ABOUT' : 
      return {
        ...state ,
        getEmpInfo : action.payload
      }

    default:
      return state;
  }
};

export default employeeReducer;
