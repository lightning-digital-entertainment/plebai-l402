import { InvoiceResponse } from "../typings/invoice";
import { Lsat, Identifier, Caveat } from 'lsat-js'
import * as Macaroon from 'macaroon'

export function createLsatFromInvoice(invoice: InvoiceResponse): Lsat {


    /*
    const identifier = new Identifier({
        paymentHash: Buffer.from(id, 'hex'),
      })

      */


      const builder = Macaroon.newMacaroon({
        version: 1,
        location: 'location',
        rootKey: 'SS',
        identifier: 'identifier.toString()',
      })

      const builderBin = builder._exportBinaryV2()

      const macaroon = Macaroon.bytesToBase64(builderBin)
      return Lsat.fromMacaroon(macaroon, 'payreq')
}



