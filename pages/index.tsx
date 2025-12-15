import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  Box,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Badge,
  HStack,
  VStack,
  IconButton,
  useToast,
  Spinner,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Progress,
  Avatar,
} from "@chakra-ui/react";
import { SearchIcon, AddIcon, RepeatIcon, PhoneIcon, EmailIcon, BuildingIcon, ViewIcon } from "@chakra-ui/icons";

interface Contact {
  _id: string;
  name?: string;
  alias?: string;
  tags?: string[];
  notes?: string;
  updatedAt?: string;
  phones?: Array<{ label?: string; value: string; e164?: string }>;
  emails?: Array<{ label?: string; value: string }>;
  addresses?: string[];
  company?: string;
  trustScore?: number;
  person?: {
    _id: string;
    phones: Array<{ label?: string; value: string; e164?: string }>;
    emails: Array<{ label?: string; value: string }>;
    addresses: string[];
    socials: { linkedIn?: string; twitter?: string; instagram?: string };
    trustScore?: number;
  };
}

export default function HomePage() {
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [newAlias, setNewAlias] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  async function loadContacts() {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token) {
        router.push("/login");
        return;
      }
      const resp = await fetch("/api/contacts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setContacts(data);
      } else if (resp.status === 401) {
        router.push("/login");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContacts();
  }, []);

  const [pendingSync, setPendingSync] = useState(0);
  const [networkUpdates, setNetworkUpdates] = useState(0);

  const total = contacts.length;
  const verified = contacts.filter((c) => {
    const score = c.trustScore ?? c.person?.trustScore ?? 0;
    return score >= 80;
  }).length;

  // Load sync status and network updates count
  useEffect(() => {
    async function loadStats() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (!token) return;

        // Load network updates count
        const updatesRes = await fetch('/api/updates', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (updatesRes.ok) {
          const updates = await updatesRes.json();
          setNetworkUpdates(updates.length);
        }
      } catch (err) {
        console.error('Failed to load stats', err);
      }
    }
    if (contacts.length > 0) {
      loadStats();
    }
  }, [contacts.length]);

  const filtered = contacts.filter((c) => {
    if (!query) return true;
    const searchTerm = query.toLowerCase().trim();
    const searchTermDigits = searchTerm.replace(/\D/g, ''); // Remove non-digits for phone search
    
    // Search by name
    const name = c.name || c.alias || '';
    const nameMatch = name.toLowerCase().includes(searchTerm);
    
    // Search by phone number (normalize for comparison)
    const allPhones = c.phones || c.person?.phones || [];
    const phoneMatch = allPhones.some((p) => {
      if (!p.value) return false;
      const phoneValue = p.value.replace(/\D/g, ''); // Remove formatting
      const phoneLower = p.value.toLowerCase();
      return phoneValue.includes(searchTermDigits) || phoneLower.includes(searchTerm);
    });
    
    // Search by email
    const allEmails = c.emails || c.person?.emails || [];
    const emailMatch = allEmails.some((e) => {
      if (!e.value) return false;
      return e.value.toLowerCase().includes(searchTerm);
    });
    
    return nameMatch || phoneMatch || emailMatch;
  });

  function getCompany(contact: Contact): string {
    const email = contact.person?.emails?.[0]?.value;
    if (!email) return "";
    const parts = email.split("@");
    if (parts.length < 2) return "";
    const domain = parts[1].split(".")[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  }

  function formatRelative(dateStr?: string): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 1) return "Today";
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  }

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    if (!newAlias) {
      toast({
        title: "Validation Error",
        description: "Name is required.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (newPhone && newPhone.length !== 10) {
      toast({
        title: "Validation Error",
        description: "Phone number must be exactly 10 digits.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (!newPhone && !newEmail) {
      toast({
        title: "Validation Error",
        description: "Please provide at least one phone or email.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setAdding(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token) {
        router.push("/login");
        return;
      }
      const payload: any = { name: newAlias };
      // Combine country code +91 with phone number
      if (newPhone) {
        payload.phones = [{ value: `+91${newPhone}`, label: "mobile", countryCode: "+91" }];
      }
      if (newEmail) payload.emails = [{ value: newEmail, label: "work" }];
      const resp = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        setNewAlias("");
        setNewPhone("");
        setNewEmail("");
        onClose();
        toast({
          title: "Success",
          description: "Contact added successfully!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        await loadContacts();
      } else if (resp.status === 401) {
        router.push("/login");
      } else {
        const err = await resp.json();
        toast({
          title: "Error",
          description: err.message || "Failed to add contact",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (ex: any) {
      toast({
        title: "Error",
        description: ex.message || "An unexpected error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setAdding(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token) {
        router.push("/login");
        return;
      }
      const resp = await fetch("/api/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        toast({
          title: "Sync Complete",
          description: "Your contacts have been synced successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        await loadContacts();
      } else {
        await loadContacts();
        toast({
          title: "Contacts Refreshed",
          description: "Your contacts have been refreshed.",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: "Sync Error",
        description: "Failed to sync contacts. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="primary.500" thickness="4px" />
          <Text color="gray.500">Loading contacts...</Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box>
      <Head>
        <title>My Contacts - SafeContacts</title>
      </Head>

      {/* Header Section */}
      <Flex justify="space-between" align="center" mb={8} flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="2xl" fontWeight="bold" mb={2} bgGradient="linear(to-r, primary.600, brand.600)" bgClip="text">
            My Contacts
          </Heading>
          <Text color="gray.500">Manage and organize your contacts</Text>
        </Box>
        <HStack spacing={3}>
          <Button
            leftIcon={<AddIcon />}
            variant="outline"
            onClick={onOpen}
            size="md"
          >
            Add Contact
          </Button>
          <Button
            leftIcon={<RepeatIcon />}
            onClick={handleSync}
            isLoading={syncing}
            loadingText="Syncing"
            size="md"
          >
            Sync Now
          </Button>
        </HStack>
      </Flex>

      {/* Statistics Cards */}
      <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={6} mb={8}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Stat>
              <StatLabel color="gray.500" fontSize="sm" fontWeight="medium">
                Total Contacts
              </StatLabel>
              <StatNumber fontSize="3xl" fontWeight="bold" color="primary.600">
                {total.toLocaleString()}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Stat>
              <StatLabel color="gray.500" fontSize="sm" fontWeight="medium">
                Verified
              </StatLabel>
              <StatNumber fontSize="3xl" fontWeight="bold" color="green.500">
                {verified.toLocaleString()}
              </StatNumber>
              <StatHelpText color="gray.400" fontSize="xs">
                Trust score ≥ 80%
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Stat>
              <StatLabel color="gray.500" fontSize="sm" fontWeight="medium">
                Pending Sync
              </StatLabel>
              <StatNumber fontSize="3xl" fontWeight="bold" color="yellow.500">
                {pendingSync.toLocaleString()}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Stat>
              <StatLabel color="gray.500" fontSize="sm" fontWeight="medium">
                Network Updates
              </StatLabel>
              <StatNumber fontSize="3xl" fontWeight="bold" color="brand.500">
                {networkUpdates.toLocaleString()}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Search Bar */}
      <Box mb={6}>
        <InputGroup size="lg" maxW={{ base: "100%", md: "500px" }}>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search contacts by name, phone, or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            bg={cardBg}
            borderColor={borderColor}
          />
        </InputGroup>
      </Box>

      {/* Contacts Grid */}
      {filtered.length === 0 ? (
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <VStack spacing={4} py={12}>
              <Text fontSize="xl" color="gray.500" fontWeight="medium">
                {query ? "No contacts found matching your search" : "No contacts yet"}
              </Text>
              {!query && (
                <Button colorScheme="primary" onClick={onOpen} leftIcon={<AddIcon />}>
                  Add Your First Contact
                </Button>
              )}
            </VStack>
          </CardBody>
        </Card>
      ) : (
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
          {filtered.map((c) => {
            // Get name from multiple possible sources
            const name = c.name || c.alias || c.phones?.[0]?.value || c.person?.phones?.[0]?.value || "Unnamed";
            const phones = c.phones || c.person?.phones || [];
            const emails = c.emails || c.person?.emails || [];
            const phone = phones[0]?.value || "";
            const email = emails[0]?.value || "";
            const company = c.company || getCompany(c);
            const score = c.trustScore ?? c.person?.trustScore ?? 0;
            const scoreColor = score >= 80 ? "green" : score >= 50 ? "yellow" : "red";

            return (
              <Card
                key={c._id}
                bg={cardBg}
                borderColor={borderColor}
                borderWidth="1px"
                _hover={{ shadow: "xl", transform: "translateY(-4px)", borderColor: "primary.300" }}
                transition="all 0.3s"
                cursor="pointer"
                onClick={() => router.push(`/contact/${c._id}`)}
              >
                <CardHeader pb={2}>
                  <Flex justify="space-between" align="start">
                    <HStack spacing={3}>
                      <Avatar
                        name={name}
                        size="md"
                        bgGradient="linear(to-br, primary.500, brand.500)"
                      />
                      <Box>
                        <Heading size="md" fontWeight="semibold" noOfLines={1}>
                          {name}
                        </Heading>
                        {company && (
                          <Text fontSize="sm" color="gray.500" noOfLines={1}>
                            {company}
                          </Text>
                        )}
                      </Box>
                    </HStack>
                    <Badge colorScheme={scoreColor} fontSize="xs" px={2} py={1}>
                      {score}%
                    </Badge>
                  </Flex>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack align="stretch" spacing={3}>
                    {phone && (
                      <HStack spacing={2} color="gray.600">
                        <PhoneIcon w={4} h={4} />
                        <Text fontSize="sm" noOfLines={1}>
                          {phone}
                        </Text>
                      </HStack>
                    )}
                    {email && (
                      <HStack spacing={2} color="gray.600">
                        <EmailIcon w={4} h={4} />
                        <Text fontSize="sm" noOfLines={1}>
                          {email}
                        </Text>
                      </HStack>
                    )}
                    {company && (
                      <HStack spacing={2} color="gray.600">
                        <BuildingIcon w={4} h={4} />
                        <Text fontSize="sm" noOfLines={1}>
                          {company}
                        </Text>
                      </HStack>
                    )}
                    {c.tags && c.tags.length > 0 && (
                      <HStack spacing={2} flexWrap="wrap">
                        {c.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} colorScheme="primary" fontSize="xs" px={2} py={1}>
                            {tag}
                          </Badge>
                        ))}
                        {c.tags.length > 3 && (
                          <Badge colorScheme="gray" fontSize="xs" px={2} py={1}>
                            +{c.tags.length - 3}
                          </Badge>
                        )}
                      </HStack>
                    )}
                    <Box>
                      <Text fontSize="xs" color="gray.400" mb={1}>
                        Trust Score
                      </Text>
                      <Progress
                        value={score}
                        colorScheme={scoreColor}
                        size="sm"
                        borderRadius="full"
                      />
                    </Box>
                    {c.updatedAt && (
                      <Text fontSize="xs" color="gray.400">
                        Updated {formatRelative(c.updatedAt)}
                      </Text>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            );
          })}
        </Grid>
      )}

      {/* Add Contact Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={addContact}>
            <ModalHeader>Add New Contact</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input
                    placeholder="Contact name"
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Country Code</FormLabel>
                  <HStack>
                    <Box fontSize="2xl">🇮🇳</Box>
                    <Input
                      type="text"
                      value="+91"
                      readOnly
                      maxW="80px"
                      bg="gray.100"
                    />
                  </HStack>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Phone Number (10 digits)</FormLabel>
                  <Input
                    type="tel"
                    placeholder="9876543210"
                    value={newPhone}
                    onChange={(e) => {
                      // Only allow digits, max 10
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setNewPhone(digits);
                    }}
                    maxLength={10}
                    pattern="[0-9]{10}"
                  />
                  {newPhone && newPhone.length !== 10 && (
                    <Text fontSize="xs" color="red.500" mt={1}>
                      Phone number must be exactly 10 digits
                    </Text>
                  )}
                </FormControl>
                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    placeholder="contact@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </FormControl>
                <Text fontSize="xs" color="gray.500">
                  At least one phone or email is required
                </Text>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" isLoading={adding} loadingText="Adding">
                Add Contact
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
}
