/**
 * Zoho Forms UTM Tracking Script
 * Captures UTM parameters from the URL, stores them in cookies,
 * and appends them to Zoho form iframe src URLs for lead attribution.
 */
function ZFAdvLead() {}
ZFAdvLead.utmPValObj = ZFAdvLead.utmPValObj || {};
ZFAdvLead.utmPNameArr = new Array(
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content"
);
ZFAdvLead.utmcustPNameArr = new Array();
ZFAdvLead.isSameDomain = false;

ZFAdvLead.prototype.zfautm_sC = function (paramName, path, domain, secure) {
  var value = ZFAdvLead.utmPValObj[paramName];
  if (typeof value !== "undefined" && value !== null) {
    var cookieStr = paramName + "=" + encodeURIComponent(value);
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + 7);
    cookieStr += "; expires=" + exdate.toGMTString();
    cookieStr += "; path=/";
    if (domain) {
      cookieStr += "; domain=" + encodeURIComponent(domain);
    }
    if (secure) {
      cookieStr += "; secure";
    }
    document.cookie = cookieStr;
  }
};

ZFAdvLead.prototype.zfautm_ini = function () {
  this.zfautm_bscPCap();
  var url_search = document.location.search;
  for (var i = 0; i < ZFAdvLead.utmcustPNameArr.length; i++) {
    var zf_pN = ZFAdvLead.utmcustPNameArr[i];
    var zf_pV;
    if (zf_pN == "referrername") {
      zf_pV = (document.URL || "").slice(0, 1500);
    } else {
      zf_pV = this.zfautm_gP(url_search, zf_pN);
      if (zf_pV == undefined || zf_pV == "") {
        zf_pV = this.zfautm_gC(zf_pN);
      }
    }
    if (typeof zf_pV !== "undefined" && zf_pV !== null && zf_pV != "") {
      ZFAdvLead.utmPValObj[zf_pN] = zf_pV;
      this.zfautm_sC(zf_pN);
    }
  }
};

ZFAdvLead.prototype.zfautm_bscPCap = function () {
  var defined_names = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ];
  var url_search = document.location.search;
  for (var i = 0; i < defined_names.length; i++) {
    var zf_pN = defined_names[i];
    var zf_pV = this.zfautm_gP(url_search, zf_pN);
    if (zf_pV == undefined || zf_pV == "") {
      zf_pV = this.zfautm_gC(zf_pN);
    }
    if (typeof zf_pV !== "undefined" && zf_pV !== null && zf_pV != "") {
      ZFAdvLead.utmPValObj[zf_pN] = zf_pV;
      this.zfautm_sC(zf_pN);
    }
  }
};

ZFAdvLead.prototype.zfautm_gP = function (s, q) {
  try {
    var match = s.match("[?&]" + q + "=([^&]*)");
    return match ? decodeURIComponent(match[1]) : "";
  } catch (e) {
    return "";
  }
};

ZFAdvLead.prototype.zfautm_gC = function (cookieName) {
  var alCookies = document.cookie.split(";");
  for (var i = 0; i < alCookies.length; i++) {
    var cookiePair = alCookies[i].split("=");
    var cName = cookiePair[0].trim();
    if (cName == cookieName) {
      return decodeURIComponent(cookiePair[1]);
    }
  }
  return "";
};

ZFAdvLead.prototype.zfautm_gC_enc = function (cookieName) {
  var alCookies = document.cookie.split(";");
  for (var i = 0; i < alCookies.length; i++) {
    var cookiePair = alCookies[i].split("=");
    var cName = cookiePair[0].trim();
    if (cName == cookieName) {
      return cookiePair[1];
    }
  }
  return "";
};

ZFAdvLead.prototype.zfautm_iframeSprt = function () {
  var zf_formsArr = document.forms;
  for (var frmInd = 0; frmInd < zf_formsArr.length; frmInd++) {
    for (var prmIdx = 0; prmIdx < ZFAdvLead.utmPNameArr.length; prmIdx++) {
      var utmPm = ZFAdvLead.utmPNameArr[prmIdx];
      var utmVal = this.zfautm_gC(ZFAdvLead.utmPNameArr[prmIdx]);
      if (typeof utmVal !== "undefined") {
        if (utmVal != "") {
          var fieldObj = zf_formsArr[frmInd][utmPm];
          if (fieldObj) {
            fieldObj.value = utmVal;
          }
        }
      }
    }
  }
};

ZFAdvLead.prototype.zfautm_DHtmlSprt = function () {
  var zf_formsArr = document.forms;
  for (var frmInd = 0; frmInd < zf_formsArr.length; frmInd++) {
    for (var prmIdx = 0; prmIdx < ZFAdvLead.utmPNameArr.length; prmIdx++) {
      var utmPm = ZFAdvLead.utmPNameArr[prmIdx];
      var utmVal = this.zfautm_gC(ZFAdvLead.utmPNameArr[prmIdx]);
      if (typeof utmVal !== "undefined") {
        if (utmVal != "") {
          var fieldObj = zf_formsArr[frmInd][utmPm];
          if (fieldObj) {
            fieldObj.value = utmVal;
          }
        }
      }
    }
  }
};

ZFAdvLead.prototype.zfautm_jsEmbedSprt = function (id) {
  var jsEmbdFrm = document.getElementById("zforms_iframe_id");
  if (!jsEmbdFrm) return;
  jsEmbdFrm.removeAttribute("onload");
  var embdSrc = jsEmbdFrm.src;
  for (var prmIdx = 0; prmIdx < ZFAdvLead.utmPNameArr.length; prmIdx++) {
    var utmPm = ZFAdvLead.utmPNameArr[prmIdx];
    utmPm =
      ZFAdvLead.isSameDomain &&
      ZFAdvLead.utmcustPNameArr.indexOf(utmPm) == -1
        ? "zf_" + utmPm
        : utmPm;
    var utmVal = this.zfautm_gC_enc(ZFAdvLead.utmPNameArr[prmIdx]);
    if (typeof utmVal !== "undefined") {
      if (utmVal != "") {
        if (embdSrc.indexOf("?") > 0) {
          embdSrc = embdSrc + "&" + utmPm + "=" + utmVal;
        } else {
          embdSrc = embdSrc + "?" + utmPm + "=" + utmVal;
        }
      }
    }
  }
  jsEmbdFrm.src = embdSrc;
};

var zfutm_zfAdvLead = new ZFAdvLead();
zfutm_zfAdvLead.zfautm_ini();

if (document.readyState == "complete") {
  zfutm_zfAdvLead.zfautm_iframeSprt();
  zfutm_zfAdvLead.zfautm_DHtmlSprt();
} else {
  window.addEventListener(
    "load",
    function () {
      zfutm_zfAdvLead.zfautm_iframeSprt();
      zfutm_zfAdvLead.zfautm_DHtmlSprt();
    },
    false
  );
}
