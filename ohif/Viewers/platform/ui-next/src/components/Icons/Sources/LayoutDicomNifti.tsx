import React from 'react';
import type { IconProps } from '../types';

/** Two linked image panes — DICOM (left) + NIfTI (right) research layout. */
export const LayoutDicomNifti = (props: IconProps) => (
  <svg
    width="29px"
    height="18px"
    viewBox="0 0 29 18"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g transform="translate(1, 1)" stroke="currentColor" strokeWidth="1.2">
        <rect x="0" y="0" width="12.5" height="16" rx="2" />
        <rect x="14.5" y="0" width="12.5" height="16" rx="2" />
        {/* link between the two panes */}
        <path d="M10.5,8 L15.5,8" strokeLinecap="round" />
        <path d="M13,5.8 L15.5,8 L13,10.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </g>
  </svg>
);
