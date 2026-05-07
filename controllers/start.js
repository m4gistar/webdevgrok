'use strict';

import logger from "../utils/logger.js";
import appStore from "../models/app-store.js";

const start = {
  createView(request, response) {
    logger.info("Start page loading!");
    
    const viewData = {
      title: "SkinB4se",
      info: appStore.getAppInfo()
    };
    
    response.render('start', viewData);   
  },
};

export default start;
