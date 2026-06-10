//
// Swiftfin is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, you can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2026 Jellyfin & Jellyfin Contributors
//

import CoreImage
import UIKit

extension UIImage {

    // Extracts the most visually prominent color by bucketing pixels into hue bins
    // and scoring each bin by saturation, avoiding muddy averages from neutral pixels.
    var prominentColor: UIColor? {
        let sampleSize = 50
        var pixels = [UInt8](repeating: 0, count: sampleSize * sampleSize * 4)

        guard let cgImage,
              let context = CGContext(
                  data: &pixels,
                  width: sampleSize,
                  height: sampleSize,
                  bitsPerComponent: 8,
                  bytesPerRow: sampleSize * 4,
                  space: CGColorSpaceCreateDeviceRGB(),
                  bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
              ) else { return nil }

        context.draw(cgImage, in: CGRect(x: 0, y: 0, width: sampleSize, height: sampleSize))

        let binCount = 12
        var scores = [CGFloat](repeating: 0, count: binCount)
        var sums = [(h: CGFloat, s: CGFloat, b: CGFloat, n: CGFloat)](repeating: (0, 0, 0, 0), count: binCount)

        for i in stride(from: 0, to: pixels.count, by: 4) {
            guard pixels[i + 3] > 200 else { continue } // skip transparent

            let r = CGFloat(pixels[i]) / 255
            let g = CGFloat(pixels[i + 1]) / 255
            let b = CGFloat(pixels[i + 2]) / 255

            var h: CGFloat = 0, s: CGFloat = 0, br: CGFloat = 0
            UIColor(red: r, green: g, blue: b, alpha: 1).getHue(&h, saturation: &s, brightness: &br, alpha: nil)

            // Skip near-black, near-white, and desaturated (grey/brown) pixels
            guard s > 0.2, br > 0.15, br < 0.92 else { continue }

            let bin = Int(h * CGFloat(binCount)) % binCount
            // Weight by saturation so vivid colors beat muted ones
            let weight = s * (0.5 + 0.5 * br)
            scores[bin] += weight
            sums[bin].h += h
            sums[bin].s += s
            sums[bin].b += br
            sums[bin].n += 1
        }

        guard let (bestIdx, _) = scores.enumerated().max(by: { $0.element < $1.element }),
              sums[bestIdx].n > 0 else { return nil }

        let n = sums[bestIdx].n
        return UIColor(
            hue: sums[bestIdx].h / n,
            saturation: sums[bestIdx].s / n,
            brightness: sums[bestIdx].b / n,
            alpha: 1
        )
    }

    var averageColor: UIColor? {
        guard let ciImage = CIImage(image: self) else { return nil }
        let extent = ciImage.extent
        let inputExtent = CIVector(x: extent.origin.x, y: extent.origin.y, z: extent.width, w: extent.height)
        guard let filter = CIFilter(name: "CIAreaAverage", parameters: [kCIInputImageKey: ciImage, kCIInputExtentKey: inputExtent]),
              let outputImage = filter.outputImage else { return nil }
        var bitmap = [UInt8](repeating: 0, count: 4)
        let context = CIContext(options: [.workingColorSpace: kCFNull as Any])
        context.render(
            outputImage,
            toBitmap: &bitmap,
            rowBytes: 4,
            bounds: CGRect(x: 0, y: 0, width: 1, height: 1),
            format: .RGBA8,
            colorSpace: nil
        )
        return UIColor(
            red: CGFloat(bitmap[0]) / 255,
            green: CGFloat(bitmap[1]) / 255,
            blue: CGFloat(bitmap[2]) / 255,
            alpha: CGFloat(bitmap[3]) / 255
        )
    }

    func data(maxSize: Int? = 30_000_000) throws -> (data: Data, contentType: String) {
        let hasAlpha = cgImage.map {
            [.alphaOnly, .first, .last, .premultipliedFirst, .premultipliedLast].contains($0.alphaInfo)
        } == true

        func validate(_ data: Data) throws {
            guard let maxSize else { return }

            if data.count > maxSize {
                throw ErrorMessage(
                    "Image is too large (\(data.count.formatted(.byteCount(style: .file))) / \(maxSize.formatted(.byteCount(style: .file)))"
                )
            }
        }

        if hasAlpha, let pngData = pngData() {
            try validate(pngData)
            return (pngData, "image/png")
        } else if let jpgData = jpegData(compressionQuality: 1) {
            try validate(jpgData)
            return (jpgData, "image/jpeg")
        } else {
            throw ErrorMessage(L10n.unknownError)
        }
    }

    func getTileImage(
        columns: Int,
        rows: Int,
        index: Int
    ) -> UIImage? {
        let x = index % columns
        let y = index / columns

        // Check if the tile index is within the valid range
//        guard x >= 0, y >= 0, x < columns, y < rows else {
//            return nil
//        }

        // Use integer arithmetic for tile dimensions and positions
        let imageWidth = Int(size.width)
        let imageHeight = Int(size.height)
        let tileWidth = imageWidth / columns
        let tileHeight = imageHeight / rows

        // Calculate the rectangle using integer values
        let rect = CGRect(
            x: x * tileWidth,
            y: y * tileHeight,
            width: tileWidth,
            height: tileHeight
        )

        // This check is now redundant because of the earlier guard statement
        // guard rect.maxX <= imageWidth && rect.maxY <= imageHeight else {
        //     return nil
        // }

        if let cgImage = cgImage?.cropping(to: rect) {
            return UIImage(cgImage: cgImage)
        }

        return nil

//        guard index >= 0 else {
//            return nil
//        }
//
//        let imageWidth = size.width
//        let imageHeight = size.height
//
//        let tileWidth = imageWidth / CGFloat(columns)
//        let tileHeight = imageHeight / CGFloat(rows)
//
//        let x = (index % columns)
//        let y = (index / columns)
//
//        let rect = CGRect(
//            x: CGFloat(x) * tileWidth,
//            y: CGFloat(y) * tileHeight,
//            width: tileWidth,
//            height: tileHeight
//        )
//
//        guard rect.maxX <= imageWidth && rect.maxY <= imageHeight else {
//            return nil
//        }
//
//        if let cgImage = cgImage?.cropping(to: rect) {
//            return UIImage(cgImage: cgImage)
//        }
//
//        return nil
    }
}
