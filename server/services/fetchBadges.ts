import axios, { AxiosResponse } from 'axios';
import { Request } from 'express';
import setLogoColor from './setLogoColor';

/**
 * Build query string from ParsedQs
 * @param {QueryString.ParsedQs} parsedQs query string possibly with replacements
 * @returns {string} query string
 */
function buildQueryString(parsedQs: any): string {
  return Object.keys(parsedQs).map((key) => `${key}=${encodeURIComponent(parsedQs[key] as string)}`).join('&');
}

/**
 * Replace logo in query string
 * @param {Request} req request object
 * @param {string} type type of the logo
 * @param {string} data data of the logo
 * @returns {QueryString.ParsedQs} parsed query string with replaced logo
 */
function replacedLogoQuery(req: Request, type: string, data: string): any {
  // replace logo slug parameter with data url
  const { query } = req;
  query.logo = `data:image/${type};base64,${data}`;
  return query;
}

/**
 * Build query string from request and item
 * @param {Request} req request object
 * @param {Object} item data about the icon or null if not found
 * @returns {string} query string
*/
function buildQueryStringFromItem(
  req: Request, item: { slug: string, type: string, data: string } | null,
): string {
  // if item not found build query string from request params
  if (item == null) {
    return buildQueryString(req.query);
  }
  let { data } = item;
  // check for logoColor parameter if it is SVG
  if (typeof req.query.logoColor === 'string' && item.type === 'svg+xml') {
    const color = req.query.logoColor;
    data = setLogoColor(data, color);
  }
  // replace logo with data url in query
  const newQuery = replacedLogoQuery(req, item.type, data);
  // build url using request params and query
  return buildQueryString(newQuery);
}

/**
 * Build a badge URL given the slug
 * @param {Request} req request object
 * @param {Object} item data about the icon or null if not found
 * @returns {string} url to badge
 */
function getBadgeUrl(
  req: Request, item: { slug: string, type: string, data: string } | null,
): string {
  // build url using request params and query
  const params = Object.values(req.params).map((p) => encodeURIComponent(p)).join('/');
  const queryString = buildQueryStringFromItem(req, item);
  return `https://img.shields.io/${params}?${queryString}`;
}

/**
 * Fetch badge from shields.io for item with same params as request
 * @param {Request} req request object
 * @param {Object} item data about the icon or null if not found
 * @returns {AxiosResponse} response from shields.io
 */
async function fetchBadgeFromRequest(
  req: Request, item: { slug: string, type: string, data: string } | null,
): Promise<AxiosResponse<any>> {
  // get shields url
  const url = getBadgeUrl(req, item);
  // get badge from url
  return axios.get(url, { validateStatus: () => true });
}

/**
 * Fetch badge from shields.io given just a slug
 * @param {string} slug slug of the icon
 * @returns {AxiosResponse} response from shields.io
 */
async function fetchDefaultBadge(slug: string): Promise<AxiosResponse<any>> {
  // get shields url
  const url = `https://img.shields.io/badge/-test-blue?logo=${slug}`;
  // get badge from url
  return axios.get(url, { validateStatus: () => true });
}

const defaultExport = {
  fetchBadgeFromRequest,
  fetchDefaultBadge,
};

export default defaultExport;
