import {
  Avatar,
  Button,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Image,
  Radio,
  Stack,
  useToast,
} from "@chakra-ui/react";
import { pathBuilder } from "@rei-sogawa/path-builder";
import { arrayMoveImmutable } from "array-move";
import imageCompression from "browser-image-compression";
import { deleteObject, getDownloadURL, getStorage, listAll, ref, uploadBytes } from "firebase/storage";
import { head } from "lodash-es";
import { FC, useEffect, useMemo, useState } from "react";
import { Field, Form } from "react-final-form";
import { v4 } from "uuid";

import { useMe } from "../contexts/Me";
import { Gender } from "../graphql/generated";
import { AdaptedRadioGroup, InputControl } from "./base/AppForm";
import { AppLoading } from "./base/AppLoading";
import { UserPhotoPicker } from "./UserPhotoPicker";

const userProfileStoragePath = pathBuilder("users/:userId/profilePhotos/:profilePhotoId");

type FormValues = {
  photoPaths: string[];
  gender: Gender;
  nickName: string;
  age: number;
  livingPref: string;
};

type FinalFormValues = Omit<FormValues, "photoPaths">;

export type UserProfileUpdateFormProps = {
  initialValues: FormValues;
  onSubmit: (values: FormValues) => Promise<void>;
};

export const UserProfileUpdateForm: FC<UserProfileUpdateFormProps> = ({ initialValues, onSubmit }) => {
  const toast = useToast();

  const { me } = useMe();

  const finalInitialValues: FinalFormValues = useMemo(
    () => ({
      gender: initialValues.gender,
      nickName: initialValues.nickName,
      age: initialValues.age,
      livingPref: initialValues.livingPref,
    }),
    []
  );

  const [photoPaths, setPhotoPaths] = useState<string[]>(initialValues.photoPaths);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const topPhotoUrl = head(photoUrls);

  useEffect(() => {
    (async () => {
      const res = await Promise.all(photoPaths.map((photoPath) => getDownloadURL(ref(getStorage(), photoPath))));
      setPhotoUrls(res);
    })();
  }, [photoPaths.length]);

  const onPick = async (file: File) => {
    const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 500 });
    const storageRef = ref(getStorage(), userProfileStoragePath({ userId: me.id, profilePhotoId: v4() }));
    const res = await uploadBytes(storageRef, compressed, { contentType: compressed.type });
    setPhotoPaths((prev) => [...prev, res.ref.fullPath]);
  };

  const onRemove = async (index: number) => {
    setPhotoPaths((prev) => prev.filter((_, _index) => _index !== index));
  };

  const onUp = (index: number) => {
    const from = index;
    const to = index - 1;
    if (from < 1) return;
    setPhotoPaths((v) => arrayMoveImmutable(v, from, to));
    setPhotoUrls((v) => arrayMoveImmutable(v, from, to));
  };

  const onDown = (index: number) => {
    const from = index;
    const to = index + 1;
    if (to > photoPaths.length - 1) return;
    setPhotoPaths((v) => arrayMoveImmutable(v, from, to));
    setPhotoUrls((v) => arrayMoveImmutable(v, from, to));
  };

  const handleFinalSubmit = async (v: FinalFormValues) => {
    if (photoPaths.length < 1) {
      toast({
        title: "プロフィール写真が設定されていません。",
        status: "error",
        position: "top-right",
        duration: 5000,
      });
      return;
    }

    await onSubmit({ ...v, age: Number(v.age), photoPaths });

    // NOTE: 不要になった storage の profilePhotos を削除
    const profilePhotosRef = ref(getStorage(), `users/${me.id}/profilePhotos`);
    const { items } = await listAll(profilePhotosRef);
    const storedPhotoPaths = items.map((i) => i.fullPath);
    const unusedPhotoPaths = storedPhotoPaths.filter((spp) => !photoPaths.includes(spp));
    await Promise.all(unusedPhotoPaths.map((upp) => deleteObject(ref(getStorage(), upp))));
  };

  return (
    <Form
      initialValues={finalInitialValues}
      onSubmit={handleFinalSubmit}
      render={({ handleSubmit, submitting }) => (
        <form onSubmit={handleSubmit}>
          <Stack spacing="6">
            <FormControl>
              <FormLabel>プロフィール写真</FormLabel>
              <Stack spacing="4">
                {topPhotoUrl && <Image src={topPhotoUrl} boxSize={{ base: "full", md: "md" }} rounded="md" />}
                <UserPhotoPicker {...{ photoUrls, onPick, onUp, onDown, onRemove }} />
              </Stack>
            </FormControl>

            <Field name="gender" label="性別" component={AdaptedRadioGroup}>
              <HStack>
                {/* FIXME: Unable to preventDefault inside passive event listener invocation. が発生する。公式でも発生している
                           https://github.com/chakra-ui/chakra-ui/issues/2925 */}
                <Radio value="MALE">男性</Radio>
                <Radio value="FEMALE">女性</Radio>
              </HStack>
            </Field>
            <InputControl name="nickName" label="ニックネーム" isRequired />
            <InputControl name="age" label="年齢" type="number" min="18" isRequired />
            <InputControl name="livingPref" label="居住地" isRequired />

            <Divider />

            <Button type="submit" colorScheme="primary" disabled={submitting}>
              保存
            </Button>
          </Stack>
        </form>
      )}
    />
  );
};
