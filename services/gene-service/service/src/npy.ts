/*!
Copyright 2018 Propel http://propel.site/.  All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// This module saves and loads from the numpy format.
// https://docs.scipy.org/doc/numpy/neps/npy-format.html

import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-node";
import request from "request";
import fetch from "node-fetch";



/** Serializes a tensor into a npy file contents. */
export async function serialize(tensor: tf.Tensor): Promise<ArrayBuffer> {
  const descr = new Map([["float32", "<f4"], ["int32", "<i4"]]).get(
    tensor.dtype,
  );

  // First figure out how long the file is going to be so we can create the
  // output ArrayBuffer.
  const magicStr = "NUMPY";
  const versionStr = "\x01\x00";
  const shapeStr = String(tensor.shape.join(",")) + ",";
  const [d, fo, s] = [descr, "False", shapeStr];
  let header = `{'descr': '${d}', 'fortran_order': ${fo}, 'shape': (${s}), }`;
  const unpaddedLength =
    1 + magicStr.length + versionStr.length + 2 + header.length;
  // Spaces to 16-bit align.
  const padding = " ".repeat((16 - unpaddedLength % 16) % 16);
  header += padding;
  assertEqual((unpaddedLength + padding.length) % 16, 0);
  // Either int32 or float32 for now Both 4 bytes per element.
  // TODO support uint8 and bool.
  const bytesPerElement = 4;
  const dataLen = bytesPerElement * numEls(tensor.shape);
  const totalSize = unpaddedLength + padding.length + dataLen;

  const ab = new ArrayBuffer(totalSize);
  const view = new DataView(ab);
  let pos = 0;

  // Write magic string and version.
  view.setUint8(pos++, 0x93);
  pos = writeStrToDataView(view, magicStr + versionStr, pos);

  // Write header length and header.
  view.setUint16(pos, header.length, true);
  pos += 2;
  pos = writeStrToDataView(view, header, pos);

  // Write data
  const data = await tensor.data();
  assertEqual(data.length, numEls(tensor.shape));
  for (let i = 0; i < data.length; i++) {
    switch (tensor.dtype) {
      case "float32":
        view.setFloat32(pos, data[i], true);
        pos += 4;
        break;

      case "int32":
        view.setInt32(pos, data[i], true);
        pos += 4;
        break;

      default:
        throw Error(`dtype ${tensor.dtype} not yet supported.`);
    }
  }
  return ab;
}

const CHUNK_SIZE = 512 * 1024 * 1024; // 512 MiB

/** Parses an ArrayBuffer containing a npy file. Returns a tensor. */
export async function parse(url: string, chunk_size = CHUNK_SIZE): Promise<tf.Tensor> {

  // get the complete length of the file
  const llength = await new Promise<number>( resolve => request({
    url, method: "HEAD"
  }, (_: any, response: any) => resolve(+response.headers["content-length"]!)));

  // read the headers 
  const headers = { Range: `bytes=0-${chunk_size}` };
  const r = (await fetch(url, { headers })).arrayBuffer();
  let ab = [ await r ];
  assert(ab[0].byteLength > 5);
  const view = new DataView(ab[0]);
  let pos = 0;

  // First parse the magic string.
  const byte0 = view.getUint8(pos++);
  const magicStr = dataViewToAscii(new DataView(ab[0], pos, 5));
  pos += 5;
  if (byte0 !== 0x93 || magicStr !== "NUMPY") {
    console.log(byte0, magicStr, dataViewToAscii(new DataView(ab[0], pos, 150)));
    throw Error("Not a numpy file.");
  }

  // Parse the version
  const version = [view.getUint8(pos++), view.getUint8(pos++)].join(".");
  if (version !== "1.0") {
    throw Error("Unsupported version.");
  }

  // Parse the header length.
  const headerLen = view.getUint16(pos, true);
  pos += 2;

  // Parse the header.
  // header is almost json, so we just manipulated it until it is.
  //  {'descr': '<f8', 'fortran_order': False, 'shape': (1, 2), }
  const headerPy = dataViewToAscii(new DataView(ab[0], pos, headerLen));
  pos += headerLen;
  const headerJson = headerPy
    .replace("True", "true")
    .replace("False", "false")
    .replace(/'/g, `"`)
    .replace(/,\s*}/, " }")
    .replace(/,?\)/, "]")
    .replace("(", "[");
  const header = JSON.parse(headerJson);


  ab = await new Promise<ArrayBuffer[]>( async resolve => {
    const abs: ArrayBuffer[] = [];
    while (pos < llength) {
      const headers = { Range: `bytes=${pos}-${pos + chunk_size - 1}` };
      const r = (await fetch(url, { headers })).arrayBuffer();
      abs.push(await r);
      pos += chunk_size;
    }
    resolve(abs);
  });

  // Finally parse the actual data.
  if (header["descr"] === "<f8") {
    // 8 byte float. float64.
    const s = ab.map(x => new Float32Array(new Float64Array(x)));
    return tf.reshape(tf.concat1d(s), header.shape);
  } else if (header["descr"] === "<f4") {
    // 4 byte float. float32.
    const s = ab.map(x => new Float32Array(x));
    return tf.reshape(tf.concat1d(s), header.shape);
  } else if (header["descr"] === "<i8") {
    // 8 byte int. int64.
    const s = ab.map(x => new Float32Array(x)).map(x => new Int32Array(x).filter((val, i) => i % 2 === 0));
    return tf.reshape(tf.concat1d(s), header.shape);
  } else if (header["descr"] === "|u1") {
    // uint8.
    const s = ab.map(x => new Uint8Array(x));
    return tf.reshape(tf.concat1d(s), header.shape); // FIXME should be "uint8"
  } else {
    throw Error(`Unknown dtype "${header["descr"]}". Implement me.`);
  }
}

function numEls(shape: number[]): number {
  if (shape.length === 0) {
    return 1;
  } else {
    return shape.reduce((a: number, b: number) => a * b);
  }
}

function writeStrToDataView(view: DataView, str: string, pos: number) {
  for (let i = 0; i < str.length; i++) {
    view.setInt8(pos + i, str.charCodeAt(i));
  }
  return pos + str.length;
}

function assertEqual(actual: number, expected: number) {
  assert(
    actual === expected,
    `actual ${actual} not equal to expected ${expected}`,
  );
}

function assert(cond: boolean, msg?: string) {
  if (!cond) {
    throw Error(msg || "assert failed");
  }
}

function dataViewToAscii(dv: DataView): string {
  let out = "";
  for (let i = 0; i < dv.byteLength; i++) {
    const val = dv.getUint8(i);
    if (val === 0) {
      break;
    }
    out += String.fromCharCode(val);
  }
  return out;
}