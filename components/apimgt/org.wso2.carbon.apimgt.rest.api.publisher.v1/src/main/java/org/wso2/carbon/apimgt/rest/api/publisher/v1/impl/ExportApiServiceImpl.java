package org.wso2.carbon.apimgt.rest.api.publisher.v1.impl;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.carbon.apimgt.api.APIManagementException;
import org.wso2.carbon.apimgt.api.APIProvider;
import org.wso2.carbon.apimgt.api.model.API;
import org.wso2.carbon.apimgt.api.model.APIIdentifier;
import org.wso2.carbon.apimgt.impl.importexport.APIImportExportException;
import org.wso2.carbon.apimgt.impl.importexport.APIImportExportManager;
import org.wso2.carbon.apimgt.impl.importexport.ExportFormat;
import org.wso2.carbon.apimgt.impl.utils.APIUtil;
import org.wso2.carbon.apimgt.rest.api.publisher.v1.*;
import org.wso2.carbon.apimgt.rest.api.publisher.v1.dto.*;

import org.apache.cxf.jaxrs.ext.multipart.Attachment;
import org.apache.cxf.jaxrs.ext.MessageContext;

import org.wso2.carbon.apimgt.rest.api.publisher.v1.dto.ErrorDTO;
import org.wso2.carbon.apimgt.rest.api.util.RestApiConstants;
import org.wso2.carbon.apimgt.rest.api.util.utils.RestApiUtil;
import org.wso2.carbon.utils.multitenancy.MultitenantUtils;

import java.io.File;

import java.util.List;

import java.io.InputStream;

import javax.ws.rs.core.Response;
import javax.ws.rs.core.SecurityContext;


public class ExportApiServiceImpl implements ExportApiService {

    private static final Log log = LogFactory.getLog(ExportApiServiceImpl.class);
    private static final String APPLICATION_EXPORT_DIR_PREFIX = "exported-app-archives-";
    private static final String DEFAULT_APPLICATION_EXPORT_DIR = "exported-application";
    private static final String PRODUCTION = "PRODUCTION";
    private static final String SANDBOX = "SANDBOX";

      public Response exportApiGet(String name, String version, String providerName, String format, Boolean preserveStatus, MessageContext messageContext) {
          ExportFormat exportFormat;
          API api;
          APIImportExportManager apiImportExportManager;
          String userName;
          APIIdentifier apiIdentifier;
          APIProvider apiProvider;
          String apiDomain;
          String apiRequesterDomain;
          //If not specified status is preserved by default
          boolean isStatusPreserved = preserveStatus == null || preserveStatus;

          if (name == null || version == null || providerName == null) {
              RestApiUtil.handleBadRequest("Invalid API Information ", log);
          }

          try {
              //Default export format is YAML
              exportFormat = StringUtils.isNotEmpty(format) ? ExportFormat.valueOf(format.toUpperCase()) :
                      ExportFormat.YAML;

              userName = RestApiUtil.getLoggedInUsername();
              //provider names with @ signs are only accepted
              apiDomain = MultitenantUtils.getTenantDomain(providerName);
              apiRequesterDomain = RestApiUtil.getLoggedInUserTenantDomain();

              if (!StringUtils.equals(apiDomain, apiRequesterDomain)) {
                  //not authorized to export requested API
                  RestApiUtil.handleAuthorizationFailure(RestApiConstants.RESOURCE_API +
                          " name:" + name + " version:" + version + " provider:" + providerName, (String) null, log);
              }

              apiIdentifier = new APIIdentifier(APIUtil.replaceEmailDomain(providerName), name, version);
              apiProvider = RestApiUtil.getLoggedInUserProvider();
              // Checking whether the API exists
              if (!apiProvider.isAPIAvailable(apiIdentifier)) {
                  String errorMessage = "Error occurred while exporting. API: " + name + " version: " + version
                          + " not found";
                  RestApiUtil.handleResourceNotFoundError(errorMessage, log);
              }

              api = apiProvider.getAPI(apiIdentifier);
              apiImportExportManager = new APIImportExportManager(apiProvider, userName);
              File file = apiImportExportManager.exportAPIArchive(api, isStatusPreserved, exportFormat);
              return Response.ok(file)
                      .header(RestApiConstants.HEADER_CONTENT_DISPOSITION, "attachment; filename=\""
                              + file.getName() + "\"")
                      .build();
          } catch (APIManagementException | APIImportExportException e) {
              RestApiUtil.handleInternalServerError("Error while exporting " + RestApiConstants.RESOURCE_API, e, log);
          }
          return null;

  }
}
