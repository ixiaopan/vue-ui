import { withInstallFunction } from "@wxp-ui/utils/with-install"
import Message from './src/message-method'

export const MMessage = withInstallFunction(Message, '$msg')

export default MMessage

// export * from './src/message'
