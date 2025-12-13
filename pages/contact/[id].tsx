/*** File: pages/contact/[id].tsx */
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  HStack,
  Heading,
  useToast,
  Spinner,
  Card,
  CardBody,
  CardHeader,
  Badge,
  IconButton,
  Flex,
  useColorModeValue,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Alert,
  AlertIcon,
  Text,
} from "@chakra-ui/react";
import { ArrowBackIcon, PhoneIcon, EmailIcon, BuildingIcon, EditIcon } from "@chakra-ui/icons";

interface Contact {
  _id: string;
  name: string;
  phones: Array<{ value: string; label?: string }>;
  emails: Array<{ value: string; label?: string }>;
  addresses: string[];
  notes?: string;
  company?: string;
  tags?: string[];
  trustScore?: number;
  linkedIn?: string;
  twitter?: string;
  instagram?: string;
}

export default function ContactDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const toast = useToast();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    if (!id) return;
    async function fetchContact() {
      try {
        setLoading(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        if (!token) {
          router.push("/login");
          return;
        }
        const resp = await fetch(`/api/contacts/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.ok) {
          const data = await resp.json();
          setContact(data);
        } else if (resp.status === 401) {
          router.push("/login");
        } else {
          const err = await resp.json();
          setError(err.message || "Failed to load contact");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchContact();
  }, [id, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!contact) return;
    setSaving(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token) {
        router.push("/login");
        return;
      }
      const resp = await fetch(`/api/contacts/${contact._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(contact),
      });
      if (!resp.ok) {
        const err = await resp.json();
        toast({
          title: "Error",
          description: err.message || "Failed to update contact",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Success",
          description: "Contact updated successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setIsEditing(false);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  }

  function addPhone() {
    if (!contact) return;
    setContact({
      ...contact,
      phones: [...(contact.phones || []), { value: "", label: "mobile" }],
    });
  }

  function removePhone(index: number) {
    if (!contact) return;
    setContact({
      ...contact,
      phones: (contact.phones || []).filter((_, i) => i !== index),
    });
  }

  function addEmail() {
    if (!contact) return;
    setContact({
      ...contact,
      emails: [...(contact.emails || []), { value: "", label: "work" }],
    });
  }

  function removeEmail(index: number) {
    if (!contact) return;
    setContact({
      ...contact,
      emails: (contact.emails || []).filter((_, i) => i !== index),
    });
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="primary.500" thickness="4px" />
          <Text color="gray.500">Loading contact...</Text>
        </VStack>
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="lg">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  if (!contact) {
    return (
      <Alert status="warning" borderRadius="lg">
        <AlertIcon />
        No contact found
      </Alert>
    );
  }

  const trustScore = contact.trustScore ?? 0;
  const scoreColor = trustScore >= 80 ? "green" : trustScore >= 50 ? "yellow" : "red";

  return (
    <Box>
      <Head>
        <title>{contact.name} - SafeContacts</title>
      </Head>

      {/* Header */}
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
        <HStack spacing={4}>
          <IconButton
            aria-label="Go back"
            icon={<ArrowBackIcon />}
            onClick={() => router.back()}
            variant="ghost"
          />
          <Heading size="xl" fontWeight="bold">
            {isEditing ? "Edit Contact" : contact.name}
          </Heading>
        </HStack>
        {!isEditing && (
          <Button
            leftIcon={<EditIcon />}
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}
      </Flex>

      <Box maxW="4xl">
        {!isEditing ? (
          /* View Mode */
          <VStack spacing={6} align="stretch">
            {/* Trust Score Card */}
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <CardBody>
                <Stat>
                  <StatLabel>Trust Score</StatLabel>
                  <StatNumber fontSize="4xl" color={`${scoreColor}.500`}>
                    {trustScore}%
                  </StatNumber>
                  <StatHelpText mb={2}>
                    {trustScore >= 80
                      ? "Highly trusted contact"
                      : trustScore >= 50
                      ? "Moderately trusted"
                      : "Low trust score"}
                  </StatHelpText>
                  <Progress
                    value={trustScore}
                    colorScheme={scoreColor}
                    size="lg"
                    borderRadius="full"
                  />
                </Stat>
              </CardBody>
            </Card>

            {/* Contact Information */}
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <CardHeader>
                <Heading size="md">Contact Information</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  {contact.phones && contact.phones.length > 0 && (
                    <Box>
                      <FormLabel fontWeight="semibold" mb={2}>
                        Phone Numbers
                      </FormLabel>
                      <VStack spacing={2} align="stretch">
                        {contact.phones.map((phone, idx) => (
                          <HStack key={idx} spacing={3}>
                            <PhoneIcon color="gray.400" />
                            <Box flex="1">
                              <Text fontSize="md">{phone.value}</Text>
                              {phone.label && (
                                <Text fontSize="xs" color="gray.500">
                                  {phone.label}
                                </Text>
                              )}
                            </Box>
                          </HStack>
                        ))}
                      </VStack>
                    </Box>
                  )}

                  {contact.emails && contact.emails.length > 0 && (
                    <Box>
                      <FormLabel fontWeight="semibold" mb={2}>
                        Email Addresses
                      </FormLabel>
                      <VStack spacing={2} align="stretch">
                        {contact.emails.map((email, idx) => (
                          <HStack key={idx} spacing={3}>
                            <EmailIcon color="gray.400" />
                            <Box flex="1">
                              <Text fontSize="md">{email.value}</Text>
                              {email.label && (
                                <Text fontSize="xs" color="gray.500">
                                  {email.label}
                                </Text>
                              )}
                            </Box>
                          </HStack>
                        ))}
                      </VStack>
                    </Box>
                  )}

                  {contact.company && (
                    <Box>
                      <FormLabel fontWeight="semibold" mb={2}>
                        Company
                      </FormLabel>
                      <HStack spacing={3}>
                        <BuildingIcon color="gray.400" />
                        <Text fontSize="md">{contact.company}</Text>
                      </HStack>
                    </Box>
                  )}

                  {contact.tags && contact.tags.length > 0 && (
                    <Box>
                      <FormLabel fontWeight="semibold" mb={2}>
                        Tags
                      </FormLabel>
                      <HStack spacing={2} flexWrap="wrap">
                        {contact.tags.map((tag) => (
                          <Badge key={tag} colorScheme="primary" fontSize="sm" px={3} py={1}>
                            {tag}
                          </Badge>
                        ))}
                      </HStack>
                    </Box>
                  )}

                  {contact.notes && (
                    <Box>
                      <FormLabel fontWeight="semibold" mb={2}>
                        Notes
                      </FormLabel>
                      <Text fontSize="md" color="gray.700" whiteSpace="pre-wrap">
                        {contact.notes}
                      </Text>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        ) : (
          /* Edit Mode */
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardHeader>
              <Heading size="md">Edit Contact</Heading>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSave}>
                <VStack spacing={6} align="stretch">
                  <FormControl isRequired>
                    <FormLabel>Name</FormLabel>
                    <Input
                      value={contact.name}
                      onChange={(e) => setContact({ ...contact, name: e.target.value })}
                      size="lg"
                    />
                  </FormControl>

                  <Box>
                    <FormLabel mb={2}>Phone Numbers</FormLabel>
                    <VStack spacing={2} align="stretch">
                      {(contact.phones || []).map((p, idx) => (
                        <HStack key={idx}>
                          <Input
                            value={p.value}
                            onChange={(e) => {
                              const newPhones = [...(contact.phones || [])];
                              newPhones[idx] = { ...newPhones[idx], value: e.target.value };
                              setContact({ ...contact, phones: newPhones });
                            }}
                            placeholder="Phone number"
                            size="lg"
                          />
                          {(contact.phones || []).length > 1 && (
                            <Button
                              onClick={() => removePhone(idx)}
                              colorScheme="red"
                              variant="ghost"
                            >
                              Remove
                            </Button>
                          )}
                        </HStack>
                      ))}
                      <Button onClick={addPhone} variant="outline" size="sm" leftIcon={<PhoneIcon />}>
                        Add Phone
                      </Button>
                    </VStack>
                  </Box>

                  <Box>
                    <FormLabel mb={2}>Email Addresses</FormLabel>
                    <VStack spacing={2} align="stretch">
                      {(contact.emails || []).map((e, idx) => (
                        <HStack key={idx}>
                          <Input
                            type="email"
                            value={e.value}
                            onChange={(ev) => {
                              const newEmails = [...(contact.emails || [])];
                              newEmails[idx] = { ...newEmails[idx], value: ev.target.value };
                              setContact({ ...contact, emails: newEmails });
                            }}
                            placeholder="Email address"
                            size="lg"
                          />
                          {(contact.emails || []).length > 1 && (
                            <Button
                              onClick={() => removeEmail(idx)}
                              colorScheme="red"
                              variant="ghost"
                            >
                              Remove
                            </Button>
                          )}
                        </HStack>
                      ))}
                      <Button onClick={addEmail} variant="outline" size="sm" leftIcon={<EmailIcon />}>
                        Add Email
                      </Button>
                    </VStack>
                  </Box>

                  <FormControl>
                    <FormLabel>Company</FormLabel>
                    <Input
                      value={contact.company || ""}
                      onChange={(e) => setContact({ ...contact, company: e.target.value })}
                      size="lg"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Tags (comma separated)</FormLabel>
                    <Input
                      value={(contact.tags || []).join(", ")}
                      onChange={(e) =>
                        setContact({
                          ...contact,
                          tags: e.target.value.split(/\s*,\s*/).filter(Boolean),
                        })
                      }
                      placeholder="e.g., friend, work, family"
                      size="lg"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Notes</FormLabel>
                    <Textarea
                      value={contact.notes || ""}
                      onChange={(e) => setContact({ ...contact, notes: e.target.value })}
                      placeholder="Add any notes about this contact..."
                      rows={4}
                    />
                  </FormControl>

                  <Divider />

                  <HStack justify="flex-end" spacing={3}>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsEditing(false);
                        // Reload contact to discard changes
                        window.location.reload();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      isLoading={saving}
                      loadingText="Saving..."
                    >
                      Save Changes
                    </Button>
                  </HStack>
                </VStack>
              </form>
            </CardBody>
          </Card>
        )}
      </Box>
    </Box>
  );
}
