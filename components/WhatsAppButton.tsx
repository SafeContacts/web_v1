// =============================================
import React from "react";
import { Menu, MenuButton, MenuList, MenuItem, Button, Icon } from "@chakra-ui/react";
import { PhoneIcon } from "@chakra-ui/icons";
import { buildWhatsAppChatUrl, buildWhatsAppCallUrl } from "../lib/deeplinks";
import { toE164 } from "../lib/phone";


export type WhatsAppButtonProps = {
phoneNumber: string; // raw digits or E164
defaultText?: string;
enableCloudApi?: boolean;
onClick?: (action: "chat" | "call" | "waba") => void;
};


export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
phoneNumber,
defaultText = "Hi! Found you via SafeContacts.",
enableCloudApi = false,
onClick,
}) => {
const e164 = toE164(phoneNumber);


const handleChat = () => {
const url = buildWhatsAppChatUrl(e164, defaultText);
window.open(url, "_blank", "noopener,noreferrer");
onClick?.("chat");
};


const handleCall = () => {
const url = buildWhatsAppCallUrl(e164);
// Some platforms may not support call scheme; fall back to showing chat link
window.location.href = url;
onClick?.("call");
};


const handleWaba = async () => {
try {
await fetch("/api/whatsapp/send", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ to: e164, type: "text", text: defaultText }),
});
onClick?.("waba");
} catch (e) {
console.error("WABA send failed", e);
}
};


return (
<Menu>
<MenuButton as={Button} leftIcon={<Icon as={PhoneIcon} />} colorScheme="green" variant="solid">
WhatsApp
</MenuButton>
<MenuList>
<MenuItem onClick={handleChat}>Chat on WhatsApp</MenuItem>
<MenuItem onClick={handleCall}>Call on WhatsApp</MenuItem>
{enableCloudApi && <MenuItem onClick={handleWaba}>Send via WhatsApp Cloud API</MenuItem>}
</MenuList>
</Menu>
);
};
